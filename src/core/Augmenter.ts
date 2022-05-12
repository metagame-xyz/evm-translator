import { transformCovalentEvents } from './transformCovalentLogs'
import { transformDecodedData, transformDecodedLogs } from './transformDecodedLogs'
import { BaseProvider, Formatter } from '@ethersproject/providers'
// import abiDecoder from 'abi-decoder'
import { Contract } from 'ethers'
import {
    Address,
    Chain,
    ContractData,
    ContractType,
    Decoded,
    DecodedCallData,
    InProgressActivity,
    Interaction,
    InteractionEvent,
    RawDecodedLog,
    RawTxData,
    RawTxDataWithoutTrace,
    TraceLog,
    TxType,
} from 'interfaces'
import { ABI_Item, ABI_ItemUnfiltered } from 'interfaces/abi'
import { CovalentTxData } from 'interfaces/covalent'
import traverse from 'traverse'
import { filterABIs, getChainById, getEntries, getKeys, isAddress, validateAndNormalizeAddress } from 'utils'
import abiDecoder from 'utils/abi-decoder'
import tokenABIMap from 'utils/ABIs'
import reverseRecordsABI from 'utils/ABIs/ReverseRecords.json'
import checkInterface from 'utils/checkInterface'
import Covalent from 'utils/clients/Covalent'
import Etherscan from 'utils/clients/Etherscan'
import fourByteDirectory from 'utils/clients/FourByteDirectory'
import { REVERSE_RECORDS_CONTRACT_ADDRESS } from 'utils/constants'
import { DatabaseInterface, NullDatabaseInterface } from 'utils/DatabaseInterface'
import getTypeFromABI from 'utils/getTypeFromABI'

export type DecoderConfig = {
    covalentData?: CovalentTxData
    useNodeForENS: boolean
    use4ByteDirectory: boolean
    useTinTin: boolean
}

export class Augmenter {
    provider: BaseProvider
    covalent: Covalent | null
    etherscan: Etherscan

    databaseInterface: DatabaseInterface

    formatter = new Formatter()
    chain: Chain

    inProgressActivity!: InProgressActivity
    rawTxDataArr!: RawTxData[]
    decodedArr!: Decoded[]

    covalentData?: CovalentTxData
    covalentDataArr: CovalentTxData[] = []

    fnSigCache: Record<string, string> = {}
    ensCache: Record<Address, string> = {}

    constructor(
        provider: BaseProvider,
        covalent: Covalent | null,
        etherscan: Etherscan,
        databaseInterface: DatabaseInterface = new NullDatabaseInterface(),
    ) {
        this.provider = provider
        this.covalent = covalent
        this.etherscan = etherscan
        this.databaseInterface = databaseInterface

        this.chain = getChainById(this.provider.network.chainId)
    }

    async decode(rawTxDataArr: RawTxData[], covalentTxDataArr: CovalentTxData[] = []): Promise<Decoded[]> {
        this.rawTxDataArr = rawTxDataArr
        this.covalentDataArr = covalentTxDataArr

        this.createDecodedArr()

        await this.decodeMethodNames()
        await this.getContractTypes()

        if (!this.covalentDataArr.length && this.rawTxDataArr.length) {
            await this.getCovalentData()
        }

        this.augmentTimestampWithCovalent()
        await this.augmentOfficialContractNames()
        this.augmentInteractionData()
        this.addTraceLogsAsInteractions()
        if (this.provider.network.chainId == 1) {
            // only mainnet
            await this.augmentENSNamesArr()
        }

        return this.decodedArr
    }

    decodeTxData(
        rawTxData: RawTxData | RawTxDataWithoutTrace,
        ABIs: Record<Address, ABI_Item[]>,
        contractDataMap: Record<Address, ContractData>,
    ): { decodedLogs: Interaction[]; decodedCallData: DecodedCallData } {
        const allABIs = []
        for (const abis of Object.values(ABIs)) {
            allABIs.push(...abis)
        }
        abiDecoder.addABI(allABIs)

        const { txReceipt } = rawTxData
        const { logs } = txReceipt

        // TODO logs that don't get decoded dont show up as 'null' or 'undefined', which will throw off mapping the logIndex to the decoded log

        const rawDecodedLogs = abiDecoder.decodeLogs(rawTxData.txReceipt.logs)
        const rawDecodedCallData = abiDecoder.decodeMethod(rawTxData.txResponse.data) || { name: null, params: [] }

        const augmentedDecodedLogs = rawDecodedLogs.map((log, index) => {
            const decodedLog = {
                ...log,
                logIndex: logs[index].logIndex,
                address: validateAndNormalizeAddress(log.address),
                decoded: true,
            }
            return decodedLog
        }) as RawDecodedLog[]

        const decodedLogs = transformDecodedLogs(rawTxData.txReceipt.logs, augmentedDecodedLogs, contractDataMap)
        const decodedCallData = transformDecodedData(rawDecodedCallData)

        return { decodedLogs, decodedCallData }
    }

    augmentDecodedData(
        decodedLogs: Interaction[],
        decodedCallData: DecodedCallData,
        ensMap: Record<Address, string>,
        contractDataMap: Record<Address, ContractData>,
        rawTxData: RawTxData | RawTxDataWithoutTrace,
    ): Decoded {
        const { txReceipt, txResponse } = rawTxData
        const value = rawTxData.txResponse.value.toString()

        let txType: TxType
        if (!txReceipt.to) {
            txType = TxType.CONTRACT_DEPLOY
        } else if (txResponse.data == '0x') {
            txType = TxType.TRANSFER
        } else {
            // TODO txReceipt.contractAddress is the address of the contract created, add it
            txType = TxType.CONTRACT_INTERACTION
        }

        // console.log('contractDataMap', contractDataMap)

        const transformedData: Decoded = {
            txHash: txResponse.hash,
            txType: txType,
            fromAddress: txReceipt.from,
            toAddress: txReceipt.to,
            officialContractName: contractDataMap[txReceipt.to].contractOfficialName,
            contractName: contractDataMap[txReceipt.to].contractName,
            contractType: contractDataMap[txReceipt.to].type,
            contractMethod: decodedCallData.name,
            contractMethodArguments: decodedCallData.params,
            nativeTokenValueSent: value,
            nativeTokenSymbol: this.chain.symbol,
            interactions: decodedLogs,
            effectiveGasPrice: txReceipt.effectiveGasPrice?.toString() || txResponse.gasPrice?.toString() || null,
            gasUsed: txReceipt.gasUsed.toString(),
            timestamp: txReceipt.timestamp,
            txIndex: txReceipt.transactionIndex,
            reverted: txReceipt.status == 0, // will return true if status==undefined
            fromENS: null,
            toENS: null,
        }

        // TODO augment with trace logs

        const transformedDataWithENS = this.augmentENSNames(transformedData, ensMap)

        return transformedDataWithENS
    }

    private createDecodedArr() {
        const formattedRawTxDataArr = this.rawTxDataArr.map((rawTxData) => {
            try {
                const { txReceipt, txResponse } = rawTxData
                const value = rawTxData.txResponse.value.toString()

                let txType: TxType
                if (!txReceipt.to) {
                    txType = TxType.CONTRACT_DEPLOY
                } else if (txResponse.data == '0x') {
                    txType = TxType.TRANSFER
                } else {
                    // TODO txReceipt.contractAddress is the address of the contract created, add it
                    txType = TxType.CONTRACT_INTERACTION
                }

                const transformedData: Decoded = {
                    txHash: txResponse.hash,
                    txType: txType,
                    nativeTokenValueSent: value,
                    nativeTokenSymbol: this.chain.symbol,
                    txIndex: txReceipt.transactionIndex,
                    reverted: txReceipt.status == 0,
                    gasUsed: txReceipt.gasUsed.toString(),
                    effectiveGasPrice:
                        txReceipt.effectiveGasPrice?.toString() || txResponse?.gasPrice?.toString() || null,
                    fromAddress: txReceipt.from,
                    toAddress: txReceipt.to,
                    interactions: [],
                    contractMethod: null,
                    contractMethodArguments: {},
                    contractType: ContractType.OTHER,
                    officialContractName: null,
                    contractName: null,
                    timestamp: txReceipt.timestamp,
                    fromENS: null,
                    toENS: null,
                }

                return transformedData
            } catch (e) {
                console.error('error in createDecodedArr', e)
                throw e
            }
        })

        this.decodedArr = formattedRawTxDataArr
    }

    private async getCovalentData(): Promise<void> {
        if (this.rawTxDataArr.length > 1) {
            throw new Error('Not implemented. This only happens if you already got raw data via Covalent')
        } else if (!this.covalent) {
            throw new Error('Covalent not initialized')
        } else {
            const covalentResponse = await this.covalent.getTransactionFor(this.rawTxDataArr[0].txResponse.hash)
            const covalentData = covalentResponse.items[0]
            this.covalentDataArr.push(covalentData)
        }
    }

    // TODO need to get it from contract JSON, ABI, and/or TinTin too, instead of Covalent
    private augmentOfficialContractNames() {
        if (this.covalentDataArr.length) {
            this.covalentDataArr.forEach((covalentData, index) => {
                this.decodedArr[index].officialContractName = covalentData.to_address_label || null
            })
        }
    }

    private augmentTimestampWithCovalent() {
        this.covalentDataArr.forEach((covalentData, index) => {
            this.decodedArr[index].timestamp = Number(covalentData.block_signed_at)
        })
    }
    private augmentInteractionData() {
        // we can get do this transformation with the ABI too. We can trust Covalent for now, but we already have a shim in there for ERC721s...
        if (this.covalentDataArr.length) {
            this.covalentDataArr.forEach((covalentData, index) => {
                this.decodedArr[index].interactions = transformCovalentEvents(covalentData)
            })
        }
    }

    private addTraceLogsAsInteractions() {
        function traceLogToEvent(nativeTokenTransfer: TraceLog): InteractionEvent {
            const { action } = nativeTokenTransfer
            return {
                eventName: 'NativeTokenTransfer',
                nativeTokenTransfer: true,
                logIndex: 0,
                params: {
                    from: action.from,
                    to: action.to,
                    value: action.value.toString(),
                },
            } as InteractionEvent
        }

        function nativeTokenTransfersOnly(traceLog: TraceLog[]): TraceLog[] {
            return traceLog.filter((traceLog) => {
                return traceLog.action.callType === 'call' && !traceLog.action.value.isZero()
            })
        }

        function add(interactions: Interaction[], traceLogs: TraceLog[]): Interaction[] {
            const nativeTokenTransfers = nativeTokenTransfersOnly(traceLogs)

            for (const ntt of nativeTokenTransfers) {
                const interaction = interactions.find(
                    (i) => i.contractAddress == ntt.action.from || i.contractAddress == ntt.action.to,
                )

                // debugger
                // usually it comes from one of the contracts that emitted other events
                if (interaction) {
                    interaction.events.push(traceLogToEvent(ntt))

                    // but sometimes... it doesn't, so we need to add that contract
                } else {
                    interactions.push({
                        contractAddress: ntt.action.from,
                        contractName: null,
                        contractSymbol: null,
                        events: [traceLogToEvent(ntt)],
                    })
                }
            }

            return interactions
        }

        if (this.rawTxDataArr.length > 0) {
            this.rawTxDataArr.forEach((rawTxData, index) => {
                this.decodedArr[index].interactions = add(this.decodedArr[index].interactions, rawTxData.txTrace)
            })
        }
    }

    async getENSNames(addresses: Address[]): Promise<Record<Address, string>> {
        const reverseRecords = new Contract(REVERSE_RECORDS_CONTRACT_ADDRESS, reverseRecordsABI, this.provider)

        const allDirtyNames = (await reverseRecords.getNames(addresses)) as string[]

        // remove illegal chars
        const names = allDirtyNames.map((name) => {
            return name.replace(/([^\w\s+*:;,.()/\\]+)/gi, '¿')
        })

        let addressToNameMap: Record<string, string> = {}

        addresses.forEach((address, index) => {
            addressToNameMap[address] = names[index]
        })

        // TODO handle arrays of addresses
        // "events":[
        //     :{
        //     "event":"SafeSetup"
        //     "logIndex":112
        //     "initiator":"0xa6b71e26c5e0845f74c812102ca7114b6a896ab2"
        //     "owners":[
        //     :"0x17a059b6b0c8af433032d554b0392995155452e6"
        //     :"0x13e2ed5724e9d6df54ed1ea5b4fa81310458c1d9"
        //     :"0x825728f78912b98adfb06380f1fcdcda76fd0f87"
        //     ]
        //     "threshold":"2"
        //     "initializer":"0x0000000000000000000000000000000000000000"
        //     "fallbackHandler":"0xf48f2b2d2a534e402487b3ee7c18c33aec0fe5e4"
        //     }
        // ]

        // filter out addresses:names with no names (most of them lol)
        addressToNameMap = Object.fromEntries(Object.entries(addressToNameMap).filter(([, v]) => v != ''))

        return addressToNameMap
    }

    augmentENSNames(decoded: Decoded, ensMap: Record<Address, string>): Decoded {
        const decodedWithENS = traverse(decoded).map((thing) => {
            if (!!thing && typeof thing === 'object' && !Array.isArray(thing)) {
                for (const [key, val] of Object.entries(thing)) {
                    if (ensMap[val as Address]) {
                        if (key == 'toAddress') {
                            thing.toENS = ensMap[val as Address]
                        } else if (key == 'fromAddress') {
                            thing.fromENS = ensMap[val as Address]
                        } else {
                            thing[key + 'ENS'] = ensMap[val as Address]
                        }
                    }
                }
            }
        })

        return decodedWithENS
    }

    private async augmentENSNamesArr(): Promise<void> {
        const allAddresses: Address[] = []

        traverse(this.decodedArr).forEach(function (value: string) {
            if (isAddress(value)) {
                allAddresses.push(validateAndNormalizeAddress(value))
            }
        })

        // filter out duplicates
        const addresses = [...new Set(allAddresses)]

        const addressToNameMap = await this.getENSNames(addresses)

        const decodedArrWithENS = traverse(this.decodedArr).map((thing) => {
            if (!!thing && typeof thing === 'object' && !Array.isArray(thing)) {
                for (const [key, val] of Object.entries(thing)) {
                    if (addressToNameMap[val as Address]) {
                        if (key == 'toAddress') {
                            thing.toENS = addressToNameMap[val as Address]
                        } else if (key == 'fromAddress') {
                            thing.fromENS = addressToNameMap[val as Address]
                        } else {
                            thing[key + 'ENS'] = addressToNameMap[val as Address]
                        }
                    }
                }
            }
        })

        this.decodedArr = decodedArrWithENS
    }

    async getNameAndSymbol(
        address: string,
        contractType: ContractType,
    ): Promise<{ tokenName: string | null; tokenSymbol: string | null; contractName: string | null }> {
        const abi = tokenABIMap[contractType]
        const contract = new Contract(address, abi, this.provider)

        const namePromise = contract.name()
        const symbolPromise = contract.symbol()

        const results = await Promise.allSettled([namePromise, symbolPromise])

        const contractName = results[0].status === 'fulfilled' ? results[0].value : null
        const tokenSymbol = results[1].status === 'fulfilled' ? results[1].value : null
        let tokenName = null

        if (
            contractType === ContractType.ERC20 ||
            contractType === ContractType.ERC721 ||
            contractType === ContractType.ERC1155
        ) {
            tokenName = contractName
        }

        return { tokenName, tokenSymbol, contractName }
    }

    private async decodeMethodName(rawTxData: RawTxData): Promise<string> {
        // first try to get if from the contract-specific interpreter, or ABI

        let contractMethod = null

        const hexSignature = rawTxData.txResponse.data.slice(0, 10)
        if (this.fnSigCache[hexSignature]) {
            contractMethod = this.fnSigCache[hexSignature]
        } else {
            contractMethod = await fourByteDirectory.getMethodSignature(hexSignature)
            this.fnSigCache[hexSignature] = contractMethod
        }

        return contractMethod
    }

    private async decodeMethodNames(): Promise<void> {
        const methodNames = await Promise.all(
            this.rawTxDataArr.map(async (rawTxData, index) => {
                let methodName = null
                if (this.decodedArr[index].txType !== TxType.TRANSFER) {
                    methodName = await this.decodeMethodName(rawTxData)
                }
                return methodName
            }),
        )

        methodNames.forEach((methodName, index) => {
            this.decodedArr[index].contractMethod = methodName
        })
    }

    async getContractType(contractAddress: Address, abiArr: ABI_ItemUnfiltered[] | null = null): Promise<ContractType> {
        if (contractAddress == this.chain.wethAddress) {
            return ContractType.WETH
        }

        let contractType = await checkInterface(contractAddress, this.provider)
        if (contractType === ContractType.OTHER) {
            contractType = await getTypeFromABI(contractAddress, this.etherscan, abiArr)
        }
        return contractType
    }
    private async getContractTypes() {
        const contractTypes = await Promise.all(
            this.rawTxDataArr.map(async (rawTxData, index) => {
                let contractType = ContractType.OTHER
                if (this.decodedArr[index].txType == TxType.CONTRACT_INTERACTION) {
                    contractType = await this.getContractType(rawTxData.txReceipt.to)
                }
                //     else if (this.decodedArr[index].txType == TX_TYPE.CONTRACT_DEPLOY) {
                //         //TODO
                // }
                return contractType
            }),
        )

        contractTypes.forEach((contractType, index) => {
            this.decodedArr[index].contractType = contractType
        })
    }

    async getContractsData(
        contractToAbiMap: Record<Address, ABI_ItemUnfiltered[]>,
        contractToOfficialNameMap: Record<Address, string | null>,
    ): Promise<Record<Address, ContractData>> {
        const contractDataMap: Record<Address, ContractData> = {}
        const filteredABIs = filterABIs(contractToAbiMap)

        const addresses = getKeys(contractToAbiMap)

        const contractDataMapFromDB = await this.databaseInterface.getContractDataForManyContracts(addresses)

        await Promise.all(
            addresses.map(async (address) => {
                const abi = contractToAbiMap[address]
                const contractType =
                    contractDataMapFromDB[address]?.type || (await this.getContractType(address, filteredABIs[address]))

                let tokenName = null
                let tokenSymbol = null
                let contractName = null

                if (contractDataMapFromDB[address]) {
                    tokenName = contractDataMapFromDB[address]?.tokenName || null
                    tokenSymbol = contractDataMapFromDB[address]?.tokenSymbol || null
                    contractName = contractDataMapFromDB[address]?.contractName || null
                }

                // warning, we might assign contactName from somewhere else in the future, so it might not be null here even when we thought it would be, which means we might still need to get token symbol/name but we end up skipping it
                if (!contractName) {
                    ;({ tokenName, tokenSymbol, contractName } = await this.getNameAndSymbol(address, contractType))
                }
                // const contractName = await this.getContractName(address)
                const contractData: ContractData = {
                    address,
                    type: contractType,
                    tokenName,
                    tokenSymbol,
                    abi,
                    contractName,
                    contractOfficialName: contractToOfficialNameMap[address],
                }

                // console.log('contractData', contractData)
                contractDataMap[address] = contractData
            }),
        )
        return contractDataMap
    }

    // TODO get the names
    async getABIsAndNamesForContracts(
        contractAddresses: Address[],
    ): Promise<[Record<Address, ABI_ItemUnfiltered[]>, Record<Address, string | null>]> {
        const addresses = contractAddresses.map((a) => validateAndNormalizeAddress(a))

        const contractDataMap = await this.databaseInterface.getContractDataForManyContracts(addresses)

        const addressesWithMissingABIs = getKeys(contractDataMap).filter((address) => !contractDataMap[address]?.abi)

        const abiMapFromEtherscan = await this.etherscan.getABIs(addressesWithMissingABIs)

        const AbiMapFromDB = getEntries(contractDataMap).reduce((acc, [address, contractData]) => {
            acc[address] = contractData?.abi || null
            return acc
        }, {} as Record<Address, ABI_ItemUnfiltered[]>)

        const abiMap = { ...AbiMapFromDB, ...abiMapFromEtherscan }

        const nameMapFromDB = getEntries(contractDataMap).reduce((acc, [address, contractData]) => {
            acc[address] = contractData?.contractOfficialName || null
            return acc
        }, {} as Record<Address, string>)

        const nameMapFromEtherscan: Record<Address, string | null> = {}

        const nameMap = { ...nameMapFromDB, ...nameMapFromEtherscan }

        return [abiMap, nameMap]
    }

    static getAllAddresses(
        decodedLogs: Interaction[],
        decodedCallData: DecodedCallData,
        contractAddresses: Address[],
    ): Address[] {
        const addresses: Address[] = []

        traverse(decodedLogs).forEach(function (value: string) {
            if (isAddress(value)) {
                addresses.push(validateAndNormalizeAddress(value))
            }
        })

        traverse(decodedCallData).forEach(function (value: string) {
            if (isAddress(value)) {
                addresses.push(validateAndNormalizeAddress(value))
            }
        })

        return [...new Set([...addresses, ...contractAddresses])]
    }
}
