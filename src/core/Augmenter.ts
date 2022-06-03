import { transformCovalentEvents } from './transformCovalentLogs'
import { transformDecodedData, transformDecodedLogs } from './transformDecodedLogs'
import { BaseProvider, Formatter } from '@ethersproject/providers'
// import abiDecoder from 'abi-decoder'
import { Contract } from 'ethers'
import traverse from 'traverse'

import {
    Chain,
    ContractData,
    ContractType,
    Decoded,
    DecodedCallData,
    InProgressActivity,
    Interaction,
    InteractionEvent,
    TxType,
} from 'interfaces'
import { ABI_Item, ABI_ItemUnfiltered } from 'interfaces/abi'
import { CovalentTxData } from 'interfaces/covalent'
import { CallTraceLog, RawTxData, RawTxDataWithoutTrace, TraceLog, TraceType } from 'interfaces/rawData'
import { AddressZ } from 'interfaces/utils'

import {
    abiArrToAbiRows,
    filterABIArray,
    filterABIMap,
    getChainById,
    getEntries,
    getKeys,
    getProxyAddresses,
    getValues,
    isAddress,
} from 'utils'
import ABIDecoder from 'utils/abi-decoder'
import tokenABIMap from 'utils/ABIs'
import reverseRecordsABI from 'utils/ABIs/ReverseRecords.json'
import checkInterface from 'utils/checkInterface'
import Covalent from 'utils/clients/Covalent'
import Etherscan from 'utils/clients/Etherscan'
import fourByteDirectory from 'utils/clients/FourByteDirectory'
import { blackholeAddress, proxyImplementationAddress, REVERSE_RECORDS_CONTRACT_ADDRESS } from 'utils/constants'
import { DatabaseInterface, NullDatabaseInterface } from 'utils/DatabaseInterface'
import getTypeFromABI from 'utils/getTypeFromABI'
import { logDebug } from 'utils/logging'

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

    db: DatabaseInterface

    formatter = new Formatter()
    chain: Chain

    inProgressActivity!: InProgressActivity
    rawTxDataArr!: RawTxData[]
    decodedArr!: Decoded[]

    covalentData?: CovalentTxData
    covalentDataArr: CovalentTxData[] = []

    fnSigCache: Record<string, string> = {}
    ensCache: Record<string, string> = {}

    constructor(
        provider: BaseProvider,
        covalent: Covalent | null,
        etherscan: Etherscan,
        databaseInterface: DatabaseInterface = new NullDatabaseInterface(),
    ) {
        this.provider = provider
        this.covalent = covalent
        this.etherscan = etherscan
        this.db = databaseInterface

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
        this.addCallTraceLogsAsInteractions()
        if (this.provider.network.chainId == 1) {
            // only mainnet
            await this.augmentENSNamesArr()
        }

        return this.decodedArr
    }

    async decodeTxData(
        rawTxData: RawTxData | RawTxDataWithoutTrace,
        abiMap: Record<string, ABI_Item[]>,
        contractDataMap: Record<string, ContractData>,
    ): Promise<{ decodedLogs: Interaction[]; decodedCallData: DecodedCallData }> {
        const allABIs: ABI_Item[] = []
        const abiArrArr = getValues(abiMap)
        allABIs.push(...abiArrArr.flat())

        const abiDecoder = new ABIDecoder(this.db)
        abiDecoder.addABI(abiMap)

        const { logs } = rawTxData.txReceipt

        const rawDecodedLogs = await abiDecoder.decodeLogs(logs, contractDataMap)
        const rawDecodedCallData = (await abiDecoder.decodeMethod(rawTxData.txResponse.data)) || {
            name: null,
            params: [],
        }

        const decodedLogs = transformDecodedLogs(rawDecodedLogs, contractDataMap)
        const decodedCallData = transformDecodedData(rawDecodedCallData)

        return { decodedLogs, decodedCallData }
    }

    augmentDecodedData(
        decodedLogs: Interaction[],
        decodedCallData: DecodedCallData,
        ensMap: Record<string, string>,
        contractDataMap: Record<string, ContractData>,
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

        const fromENS = ensMap[txReceipt.from] || null
        const toENS = ensMap[txReceipt.to || ''] || null

        const interactions =
            'txTrace' in rawTxData ? Augmenter.augmentTraceLogs(decodedLogs, rawTxData.txTrace) : decodedLogs

        const interpreterMap = txReceipt.to ? contractDataMap[txReceipt.to] : null

        const transformedData: Decoded = {
            txHash: txResponse.hash,
            txType: txType,
            fromAddress: txReceipt.from,
            toAddress: txReceipt.to,
            officialContractName: interpreterMap?.contractOfficialName || null,
            contractName: interpreterMap?.contractName || null,
            contractType: interpreterMap?.type || ContractType.OTHER,
            methodCall: {
                name: decodedCallData.name,
                arguments: decodedCallData.params,
                ...(!decodedCallData.decoded && { decoded: decodedCallData.decoded }),
            },
            nativeValueSent: value,
            chainSymbol: this.chain.symbol,
            interactions,
            effectiveGasPrice: txReceipt.effectiveGasPrice?.toString() || txResponse.gasPrice?.toString() || null,
            gasUsed: txReceipt.gasUsed.toString(),
            timestamp: txReceipt.timestamp,
            txIndex: txReceipt.transactionIndex,
            reverted: txReceipt.status == 0, // will return true if status==undefined
            fromENS,
            toENS,
        }

        const transformedAugmentedData = Augmenter.augmentENSNames(transformedData, ensMap)

        return transformedAugmentedData
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
                    nativeValueSent: value,
                    chainSymbol: this.chain.symbol,
                    txIndex: txReceipt.transactionIndex,
                    reverted: txReceipt.status == 0,
                    gasUsed: txReceipt.gasUsed.toString(),
                    effectiveGasPrice:
                        txReceipt.effectiveGasPrice?.toString() || txResponse?.gasPrice?.toString() || null,
                    fromAddress: txReceipt.from,
                    toAddress: txReceipt.to,
                    interactions: [],
                    methodCall: {
                        name: null,
                        arguments: {},
                    },
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

    static augmentTraceLogs(interactionsWithoutNativeTransfers: Interaction[], traceLogs: TraceLog[]): Interaction[] {
        const interactions = [...interactionsWithoutNativeTransfers]

        function traceLogToEvent(nativeTransfer: TraceLog): InteractionEvent {
            const { action, type } = nativeTransfer

            const generalNativeEvent: { nativeTransfer: true; logIndex: null } = {
                nativeTransfer: true,
                logIndex: null,
            }

            switch (type) {
                case TraceType.enum.call:
                    return {
                        eventName: 'NativeTransfer',
                        params: {
                            from: action.from,
                            to: action.to,
                            value: action.value.toString(),
                        },
                        ...generalNativeEvent,
                    }
                case TraceType.enum.create:
                    return {
                        eventName: 'NativeCreate',
                        params: {
                            from: action.from,
                            value: action.value.toString(),
                        },
                        ...generalNativeEvent,
                    }
                case TraceType.enum.suicide:
                    return {
                        eventName: 'NativeSuicide',
                        params: {
                            from: action.address,
                            refundAddress: action.refundAddress,
                            balance: action.balance.toString(),
                        },
                        ...generalNativeEvent,
                    }
                case TraceType.enum.reward:
                    return {
                        eventName: 'NativeReward',
                        params: {
                            author: action.author,
                            rewardType: action.rewardType,
                            value: action.value.toString(),
                        },
                        ...generalNativeEvent,
                    }
                default:
                    return {
                        eventName: 'NativeUnknown',
                        params: {},
                        ...generalNativeEvent,
                    }
            }
        }

        function filterToNativeTransfers(traceLogs: TraceLog[]): CallTraceLog[] {
            const nativeTransfers = []

            for (let i = 0; i < traceLogs.length; i++) {
                const traceLog = traceLogs[i]

                if (
                    traceLog.type === TraceType.enum.call &&
                    traceLog.action.callType == 'call' &&
                    !traceLog.action.value.isZero() &&
                    !traceLog.error
                ) {
                    nativeTransfers.push(traceLog)
                }
            }

            return nativeTransfers
        }

        const nativeTransfers = filterToNativeTransfers(traceLogs)

        // add native transfers to interactions array
        for (const nt of nativeTransfers) {
            const interaction = interactions.find(
                (i) => i.contractAddress == nt.action.from || i.contractAddress == nt.action.to,
            )

            // debugger
            // usually it comes from one of the contracts that emitted other events
            if (interaction) {
                interaction.events.push(traceLogToEvent(nt))

                // but sometimes... it doesn't, so we need to add that contract
            } else {
                interactions.push({
                    contractAddress: nt.action.from,
                    contractName: null,
                    contractSymbol: null,
                    events: [traceLogToEvent(nt)],
                })
            }
        }

        return interactions
    }

    private addCallTraceLogsAsInteractions() {
        if (this.rawTxDataArr.length > 0) {
            this.rawTxDataArr.forEach((rawTxData, index) => {
                this.decodedArr[index].interactions = Augmenter.augmentTraceLogs(
                    this.decodedArr[index].interactions,
                    rawTxData.txTrace,
                )
            })
        }
    }

    async getENSNames(addresses: string[]): Promise<Record<string, string>> {
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

    static augmentENSNames(decoded: Decoded, ensMap: Record<string, string>): Decoded {
        const decodedWithENS = traverse(decoded).map((thing) => {
            if (!!thing && typeof thing === 'object' && !Array.isArray(thing)) {
                for (const [key, val] of Object.entries(thing)) {
                    if (typeof val === 'string') {
                        if (ensMap[val]) {
                            if (key == 'toAddress') {
                                thing.toENS = ensMap[val]
                            } else if (key == 'fromAddress') {
                                thing.fromENS = ensMap[val]
                            } else {
                                thing[key + 'ENS'] = ensMap[val]
                            }
                        }
                    }
                }
            }
        })

        return decodedWithENS
    }

    private async augmentENSNamesArr(): Promise<void> {
        const allAddresses: string[] = []

        traverse(this.decodedArr).forEach(function (value: string) {
            if (this.isLeaf && isAddress(value)) {
                allAddresses.push(AddressZ.parse(value))
            }
        })

        // filter out duplicates
        const addresses = [...new Set(allAddresses)]

        const addressToNameMap = await this.getENSNames(addresses)

        const decodedArrWithENS = traverse(this.decodedArr).map((thing) => {
            if (!!thing && typeof thing === 'object' && !Array.isArray(thing)) {
                for (const [key, val] of Object.entries(thing)) {
                    if (typeof val === 'string') {
                        if (addressToNameMap[val]) {
                            if (key == 'toAddress') {
                                thing.toENS = addressToNameMap[val]
                            } else if (key == 'fromAddress') {
                                thing.fromENS = addressToNameMap[val]
                            } else {
                                thing[key + 'ENS'] = addressToNameMap[val]
                            }
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

        if (contractName) {
            logDebug({ address }, `${contractName} (${tokenSymbol})`)
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
            this.decodedArr[index].methodCall.name = methodName
        })
    }

    async getContractType(contractAddress: string, abiArr: ABI_ItemUnfiltered[] | null = null): Promise<ContractType> {
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
                if (this.decodedArr[index].txType == TxType.CONTRACT_INTERACTION && rawTxData.txResponse.to) {
                    contractType = await this.getContractType(rawTxData.txReceipt.to || blackholeAddress) // WARNING hack for now
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
        contractToAbiMap: Record<string, ABI_ItemUnfiltered[]>,
        contractToOfficialNameMap: Record<string, string | null>,
        proxyAddressMap: Record<string, string>,
    ): Promise<Record<string, ContractData>> {
        const contractDataMap: Record<string, ContractData> = {}
        const filteredABIs = filterABIMap(contractToAbiMap)

        const addresses = getKeys(contractToAbiMap)

        const contractDataMapFromDB = await this.db.getContractDataForManyContracts(addresses)

        await Promise.all(
            addresses.map(async (address) => {
                const proxyAddress = proxyAddressMap[address] || null
                const abi = contractToAbiMap[address]
                // if the contract has a proxy, add the proxy's ABI too
                if (proxyAddress) abi.concat(contractToAbiMap[proxyAddress])

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
                    proxyAddress,
                }

                // console.log('contractData', contractData)
                contractDataMap[address] = contractData
            }),
        )

        await this.db.addOrUpdateManyContractData(getValues(contractDataMap).flat())
        return contractDataMap
    }

    async getProxyContractMap(contractAddresses: string[]): Promise<Record<string, string>> {
        const proxyMap: Record<string, string> = {}
        const proxyAddresses = await getProxyAddresses(this.provider, contractAddresses)

        for (const [index, proxyAddress] of proxyAddresses.entries()) {
            if (proxyAddress) {
                proxyMap[contractAddresses[index]] = proxyAddress
            }
        }

        return proxyMap
    }

    // TODO get the names
    async getABIsAndNamesForContracts(
        contractAddresses: string[],
    ): Promise<[Record<string, ABI_ItemUnfiltered[]>, Record<string, string | null>]> {
        const addresses = contractAddresses.map((a) => AddressZ.parse(a))

        const contractDataMapWithNulls = await this.db.getContractDataForManyContracts(addresses)

        const addressesWithMissingABIs = getKeys(contractDataMapWithNulls).filter(
            (address) => !contractDataMapWithNulls[address]?.abi,
        )

        addressesWithMissingABIs.forEach((address) => {
            logDebug({ address }, 'missing ABI. retrieving from etherscan')
        })

        const contractDataMap = Object.fromEntries(
            Object.entries(contractDataMapWithNulls).filter(([, v]) => v != null),
        ) as Record<string, ContractData>

        // get abis from etherscan only for contracts we dont have an abi for
        const abiMapFromEtherscan = await this.etherscan.getABIs(addressesWithMissingABIs)

        // an array of all abis
        const abiArray = getValues(abiMapFromEtherscan).flat()
        // insert all abis into the abi table

        const filtered = filterABIArray(abiArray)

        await this.db.addOrUpdateManyABI(abiArrToAbiRows(filtered))

        const AbiMapFromDB = getEntries(contractDataMap).reduce((acc, [address, contractData]) => {
            acc[address] = contractData.abi || null
            return acc
        }, {} as Record<string, ABI_ItemUnfiltered[]>)

        const abiMap = { ...AbiMapFromDB, ...abiMapFromEtherscan }

        const nameMapFromDB = getEntries(contractDataMap).reduce((acc, [address, contractData]) => {
            acc[address] = contractData.contractOfficialName || null
            return acc
        }, {} as Record<string, string | null>)

        // TODO get names from 3rd party APIs
        const nameMapFromEtherscan: Record<string, string | null> = {}

        const nameMap = { ...nameMapFromDB, ...nameMapFromEtherscan }

        return [abiMap, nameMap]
    }

    static getAllAddresses(
        decodedLogs: Interaction[],
        decodedCallData: DecodedCallData,
        contractAddresses: string[],
    ): string[] {
        const addresses: string[] = []

        traverse(decodedLogs).forEach(function (value: string) {
            if (this.isLeaf && isAddress(value)) {
                addresses.push(AddressZ.parse(value))
            }
        })

        traverse(decodedCallData).forEach(function (value: string) {
            if (this.isLeaf && isAddress(value)) {
                addresses.push(AddressZ.parse(value))
            }
        })

        return [...new Set([...addresses, ...contractAddresses])]
    }
}
