import { decodeRawTxTrace } from './MulticallTxInterpreter'
import { transformDecodedData, transformDecodedLogs, transformTraceData } from './transformDecodedLogs'
import { AlchemyProvider, Formatter, JsonRpcProvider } from '@ethersproject/providers'
import axios from 'axios'
import { Contract } from 'ethers'
import traverse from 'traverse'

import { ABI_Item, ABI_ItemUnfiltered } from 'interfaces/abi'
import { CovalentTxData } from 'interfaces/covalent'
import {
    ContractData,
    ContractType,
    DecodedCallData,
    DecodedTx,
    Interaction,
    InteractionEvent,
    TxType,
} from 'interfaces/decoded'
import { CallTraceLog, RawTxData, TraceLog, TraceType } from 'interfaces/rawData'
import { Chain } from 'interfaces/utils'
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
import { blackholeAddress, REVERSE_RECORDS_CONTRACT_ADDRESS } from 'utils/constants'
import { DatabaseInterface, NullDatabaseInterface } from 'utils/DatabaseInterface'
import getTypeFromABI from 'utils/getTypeFromABI'
import isGnosisSafeMaybe from 'utils/isGnosisSafeMaybe'
import { LogData, logDebug, logWarning } from 'utils/logging'

export type DecoderConfig = {
    covalentData?: CovalentTxData
    useNodeForENS: boolean
    use4ByteDirectory: boolean
    useTinTin: boolean
}

export class Augmenter {
    provider: AlchemyProvider | JsonRpcProvider
    covalent: Covalent | null
    etherscan: Etherscan

    db: DatabaseInterface

    formatter = new Formatter()
    chain: Chain

    rawTxDataArr!: RawTxData[]
    decodedArr!: DecodedTx[]

    fnSigCache: Record<string, string> = {}
    ensCache: Record<string, string> = {}

    constructor(
        provider: AlchemyProvider | JsonRpcProvider,
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

    async decodeTxData(
        rawTxData: RawTxData,
        abiMap: Record<string, ABI_Item[]>,
        contractDataMap: Record<string, ContractData>,
    ): Promise<{ decodedLogs: Interaction[]; decodedCallData: DecodedCallData; decodedTraceData: DecodedCallData[] }> {
        const abiDecoder = new ABIDecoder(this.db)

        abiDecoder.addABI(abiMap)
        const { logs } = rawTxData.txReceipt

        const rawDecodedLogs = await abiDecoder.decodeLogs(logs, contractDataMap)
        const rawDecodedCallData = (await abiDecoder.decodeMethod(rawTxData.txResponse.data)) || {
            name: null,
            params: [],
        }
        const rawDecodedTraceData = await decodeRawTxTrace(abiDecoder, (rawTxData as any)?.txTrace || [])

        const decodedLogs: Interaction[] = transformDecodedLogs(rawDecodedLogs, contractDataMap)
        const decodedCallData: DecodedCallData = transformDecodedData(rawDecodedCallData)
        const decodedTraceData: DecodedCallData[] = transformTraceData(rawDecodedTraceData)

        return { decodedLogs, decodedCallData, decodedTraceData }
    }

    augmentDecodedData(
        decodedLogs: Interaction[],
        decodedCallData: DecodedCallData,
        decodedTraceData: DecodedCallData[],
        ensMap: Record<string, string>,
        contractDataMap: Record<string, ContractData>,
        rawTxData: RawTxData,
    ): DecodedTx {
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

        const transformedData: DecodedTx = {
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
            traceCalls: decodedTraceData,
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

            // usually it comes from one of the contracts that emitted other events
            if (interaction) {
                interaction.events.push(traceLogToEvent(nt))

                // but sometimes... it doesn't, so we need to add that contract
            } else {
                interactions.push({
                    contractAddress: nt.action.from,
                    contractName: null,
                    contractSymbol: null,
                    contractType: ContractType.OTHER, //TODO it's probably not 'other', it's probably 'native' or something
                    events: [traceLogToEvent(nt)],
                })
            }
        }

        return interactions
    }

    async getENSNames(addresses: string[]): Promise<Record<string, string>> {
        if (this.chain.symbol !== 'ETH') return {}
        const reverseRecords = new Contract(REVERSE_RECORDS_CONTRACT_ADDRESS, reverseRecordsABI, this.provider)

        let allDirtyNames: string[] = []
        try {
            allDirtyNames = (await reverseRecords.getNames(addresses)) as string[]
        } catch (e) {
            logWarning(
                {
                    function_name: 'getENSNames',
                },
                `Error getting ENS names. ${addresses.length} in the array. Dunno which one triggered the error.`,
            )
            allDirtyNames = new Array(addresses.length).fill('')
        }

        // remove illegal chars TODO allow more chars
        const names = allDirtyNames.map((name) => {
            return name.replace(/([^\w\s+*:;,.()\-/\\]+)/gi, '¿')
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

    static augmentENSNames(decoded: DecodedTx, ensMap: Record<string, string>): DecodedTx {
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

    async downloadContractsFromTinTin(): Promise<ContractData[]> {
        // TODO programmatically get the latest hash of this repo and use that instead of this hardcoded one
        const mainnetTinTinUrl =
            'https://raw.githubusercontent.com/tintinweb/smart-contract-sanctuary-ethereum/eb6b57e33f0a157c3688024a1eead4ea85753bd1/contracts/mainnet/contracts.json'

        const contractMapping = (await axios.get(mainnetTinTinUrl).then((res) =>
            JSON.parse(`[${res.data.replaceAll('}', '},').slice(0, -2)}]`).map((mapping: any) => ({
                address: mapping.address,
                contractOfficialName: mapping.name,
                txCount: mapping.txCount,
                type: ContractType.OTHER,
                tokenName: null,
                tokenSymbol: null,
                contractName: null,
                abi: [],
                proxyAddress: null,
            })),
        )) as ContractData[]

        await this.db.addOrUpdateManyContractData(contractMapping)

        return contractMapping
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

    async getContractType(contractAddress: string, abiArr: ABI_ItemUnfiltered[] | null = null): Promise<ContractType> {
        if (contractAddress == this.chain.wethAddress) {
            return ContractType.WETH
        }
        if (contractAddress == this.chain.usdcAddress) {
            return ContractType.ERC20
        }

        let contractType = await checkInterface(contractAddress, this.provider)
        if (contractType === ContractType.OTHER) {
            contractType = await getTypeFromABI(contractAddress, this.etherscan, abiArr)
        }
        if (contractType === ContractType.OTHER) {
            contractType = await isGnosisSafeMaybe(contractAddress, this.provider)
        }
        // if (contractType === ContractType.OTHER) {
        //     try {
        //         const code = await this.provider.getCode(contractAddress)
        //         if (code == '0x') {
        //             contractType = ContractType.EOA
        //         }
        //     } catch (e) {
        //         logError({ functionName: 'provider.getCode', address: contractAddress }, e)
        //     }
        // }
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
        try {
            const contractDataMap: Record<string, ContractData> = {}
            const filteredABIs = filterABIMap(contractToAbiMap)

            const addresses = getKeys(contractToAbiMap).map((address) => AddressZ.parse(address))

            const contractDataMapFromDB = await this.db.getManyContractDataMap(addresses)

            await Promise.all(
                addresses.map(async (address) => {
                    const proxyAddress = proxyAddressMap[address] || null
                    const abi = contractToAbiMap[address]
                    // if the contract has a proxy, add the proxy's ABI too
                    if (proxyAddress) abi.concat(contractToAbiMap[proxyAddress])

                    let contractType = contractDataMapFromDB[address]?.type

                    if (!contractType || contractType === ContractType.OTHER) {
                        contractType = await this.getContractType(address, filteredABIs[address])
                    }

                    let tokenName = null
                    let tokenSymbol = null
                    let contractName = null

                    if (contractDataMapFromDB[address]) {
                        tokenName = contractDataMapFromDB[address]?.tokenName || null
                        tokenSymbol = contractDataMapFromDB[address]?.tokenSymbol || null
                        contractName = contractDataMapFromDB[address]?.contractName || null
                    }

                    // warning, we might assign contactName from somewhere else in the future, so it might not be null here even when we thought it would be, which means we might still need to get token symbol/name but we end up skipping it

                    // commented this out to make sure we get the token name/symbol from the contract. we'll end up always doing this call no matter what now but we can optimize later (WARNING)
                    if (!contractName || !tokenName || !tokenSymbol) {
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
                        txCount: null,
                    }

                    // console.log('contractData', contractData)
                    contractDataMap[address] = contractData
                }),
            )

            await this.db.addOrUpdateManyContractData(getValues(contractDataMap).flat())
            return contractDataMap
        } catch (e) {
            console.log('getContractsData', e)
            throw e
        }
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
        try {
            const addresses = contractAddresses.map((a) => AddressZ.parse(a))

            const logData: LogData = {
                function_name: 'db.getManyContractDataMap',
            }
            const contractDataMapWithNulls = await this.db.getManyContractDataMap(addresses)

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
            logData.function_name = 'getABIs'
            const abiMapFromEtherscan = await this.etherscan.getABIs(addressesWithMissingABIs)

            // an array of all abis
            const abiArray = getValues(abiMapFromEtherscan).flat()
            // insert all abis into the abi table

            const filtered = filterABIArray(abiArray)

            logData.function_name = 'db.addOrUpdateManyABI'
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
        } catch (e) {
            console.log('error getting ABIs', e)
            throw e
        }
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
