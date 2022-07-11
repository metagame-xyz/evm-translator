import { AlchemyConfig, initializeAlchemy, Network } from '@alch/alchemy-sdk'
import { AlchemyProvider } from '@ethersproject/providers'

import { ABI_Item, ABI_ItemUnfiltered } from 'interfaces/abi'
import { ContractData, ContractType, DecodedCallData, DecodedTx, Interaction } from 'interfaces/decoded'
import { ActivityData, Interpretation } from 'interfaces/interpreted'
import { RawTxData, RawTxDataWithoutTrace } from 'interfaces/rawData'
import { EVMTransaction } from 'interfaces/s3'
import { Chain } from 'interfaces/utils'
import { AddressZ } from 'interfaces/utils'

import { filterABIMap, getValues } from 'utils'
import Covalent from 'utils/clients/Covalent'
import Etherscan, { EtherscanServiceLevel } from 'utils/clients/Etherscan'
import { DatabaseInterface, NullDatabaseInterface } from 'utils/DatabaseInterface'
import { LogData, logError } from 'utils/logging'
import { MongooseDatabaseInterface } from 'utils/mongoose'
import timer from 'utils/timer'

import { Augmenter } from 'core/Augmenter'
import Interpreter from 'core/Interpreter'
import RawDataFetcher from 'core/RawDataFetcher'

export type TranslatorConfig = {
    chain: Chain
    nodeUrl?: string
    alchemyProjectId: string
    etherscanAPIKey: string
    userAddress?: string
    connectionString?: string
    etherscanServiceLevel?: EtherscanServiceLevel
    covalentAPIKey?: string
}

export type NamesAndSymbolsMap = Record<string, { name: string | null; symbol: string | null }>

// const defaultConfig: TranslatorConfigTwo = {
//     chain: getChainBySymbol('ETH'),
// }

class Translator {
    nodeUrl: string | null
    alchemyProjectId: string
    chain: Chain
    provider: AlchemyProvider
    rawDataFetcher: RawDataFetcher
    etherscan: Etherscan
    userAddress: string | null
    augmenter: Augmenter
    interpreter: Interpreter
    databaseInterface: DatabaseInterface
    covalent: Covalent | null

    constructor(config: TranslatorConfig) {
        this.chain = config.chain
        this.nodeUrl = config.nodeUrl || null
        this.alchemyProjectId = config.alchemyProjectId
        this.userAddress = config.userAddress ? AddressZ.parse(config.userAddress) : null
        this.provider = this.getProvider()
        this.etherscan = new Etherscan(config.etherscanAPIKey, config.etherscanServiceLevel)
        this.databaseInterface = config.connectionString
            ? new MongooseDatabaseInterface(config.connectionString)
            : new NullDatabaseInterface()

        this.rawDataFetcher = new RawDataFetcher(this.provider)
        this.augmenter = new Augmenter(this.provider, null, this.etherscan, this.databaseInterface)
        this.interpreter = new Interpreter(config.chain, null, this.databaseInterface)
        this.covalent = config.covalentAPIKey ? new Covalent(config.covalentAPIKey, config.chain.id) : null
    }

    async initializeMongoose() {
        if (this.databaseInterface instanceof MongooseDatabaseInterface) {
            await this.databaseInterface.connect()
        }
    }

    private getProvider(): AlchemyProvider {
        if (this.nodeUrl) {
            throw new Error(
                'the node url option (JsonRpcProvider instead of AlchemyProvider) Not implemented. RawDataFetcher uses AlchemyProvider b/c defaultProvider was throwing errors, and using just Alchemy was not throwing errors',
            )
            // return new JsonRpcProvider(this.nodeUrl, this.chain.id)
        }
        if (this.alchemyProjectId) {
            const settings: AlchemyConfig = {
                apiKey: this.alchemyProjectId, // Replace with your Alchemy API Key.
                network: Network.ETH_MAINNET, // Replace with your network. // TODO move this to Chain config
                maxRetries: 10,
            }

            const alchemy = initializeAlchemy(settings)
            const provider = alchemy.getProvider()

            return provider
        } else {
            throw new Error('No node url or alchemy project id provided')
        }
    }

    updateUserAddress(userAddress: string) {
        this.userAddress = AddressZ.parse(userAddress)
    }

    /**********************************************/
    /**** FROM WALLET ADDRESS OR TX HASH ONLY *****/
    /**********************************************/
    async getTxHashesByBlockNumber(blockNumber: string): Promise<string[]> {
        return this, this.rawDataFetcher.getTxHashesByBlockNumber(blockNumber)
    }

    // Gets the txResponse, txReceipt, txTrace from a node. Archive node needed
    async getRawTxData(txHash: string): Promise<RawTxData> {
        return this.rawDataFetcher.getTxData(txHash)
    }

    async getRawTxDataWithoutTrace(txHash: string): Promise<RawTxDataWithoutTrace> {
        return this.rawDataFetcher.getTxDataWithoutTrace(txHash)
    }

    async getTxHashArrayForAddress(
        address: string,
        // includeInitiatedTxs = true,
        // includeNotInitiatedTxs = false,
        limit = 100,
    ): Promise<string[]> {
        if (!this.covalent) throw new Error('Covalent not configured')

        const ens = (await this.getENSNames([address]))[address]

        timer.startTimer(`covalent for ${ens || address}`)
        const allCovalentTxDataArr = await this.covalent.getTransactionsFor(AddressZ.parse(address), limit)
        timer.stopTimer(`covalent for ${ens || address}`)

        return allCovalentTxDataArr.map((txData) => txData.tx_hash)
    }

    getRawDataFromS3Data(tx: EVMTransaction, timestamp: number): RawTxData {
        return this.rawDataFetcher.getTxDataFromS3Tx(tx, timestamp)
    }

    // Could rely on Etherscan, but they have a max of 10k records
    // async getAllTxHashesForAddress(address: string): Promise<string[]> {
    //     throw new Error('Not implemented')
    // }

    getContractAddressesFromRawTxData(rawTxData: RawTxData | RawTxDataWithoutTrace): string[] {
        return RawDataFetcher.getContractAddressesFromRawTxData(rawTxData)
    }

    /**********************************************/
    /**** USING TX AND CONTRACT ADDRESSES  ********/
    /****  Data used to decode & augment   ********/
    /**********************************************/

    getAllAddresses(
        decodedLogs: Interaction[],
        decodedCallData: DecodedCallData,
        contractAddresses: string[],
    ): string[] {
        return Augmenter.getAllAddresses(decodedLogs, decodedCallData, contractAddresses)
    }

    async getABIsAndNamesForContracts(
        contractAddresses: string[],
    ): Promise<[Record<string, ABI_ItemUnfiltered[]>, Record<string, string | null>]> {
        return this.augmenter.getABIsAndNamesForContracts(contractAddresses)
    }

    async getProxyContractMap(contractAddresses: string[]): Promise<Record<string, string>> {
        return this.augmenter.getProxyContractMap(contractAddresses)
    }

    async getNameAndSymbol(
        address: string,
        contractType: ContractType,
    ): Promise<{ tokenName: string | null; tokenSymbol: string | null; contractName: string | null }> {
        return this.augmenter.getNameAndSymbol(address, contractType)
    }

    async downloadContractsFromTinTin(): Promise<ContractData[]> {
        return this.augmenter.downloadContractsFromTinTin()
    }

    async getENSName(address: string): Promise<string> {
        const nameMap = await this.augmenter.getENSNames([address])
        return nameMap[address]
    }
    async getENSNames(addresses: string[]): Promise<Record<string, string>> {
        return this.augmenter.getENSNames(addresses)
    }

    async getContractsData(
        contractToAbiMap: Record<string, ABI_ItemUnfiltered[]>,
        contractToOfficialNameMap: Record<string, string | null>,
        proxyAddressMap: Record<string, string>,
    ): Promise<Record<string, ContractData>> {
        return this.augmenter.getContractsData(contractToAbiMap, contractToOfficialNameMap, proxyAddressMap)
    }

    // We should store this in a contracts table just so we can see this data more easily
    getContractType(address: string, abi: ABI_Item[]): Promise<ContractType> {
        return this.augmenter.getContractType(address, abi)
    }

    /**********************************************/
    /******      DECODING / AUGMENTING     ********/
    /**********************************************/
    async decodeTxData(
        rawTxData: RawTxData | RawTxDataWithoutTrace,
        ABIs: Record<string, ABI_Item[]>,
        contractDataMap: Record<string, ContractData>,
    ): Promise<{ decodedLogs: Interaction[]; decodedCallData: DecodedCallData; decodedTraceData: DecodedCallData[] }> {
        return await this.augmenter.decodeTxData(rawTxData, ABIs, contractDataMap)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    decodeTxDataArr(rawTxDataArr: RawTxData[], ABIs: Record<string, ABI_Item[]>[]): DecodedTx[] {
        throw new Error('Not implemented')
    }

    augmentDecodedData(
        decodedLogs: Interaction[],
        decodedCallData: DecodedCallData,
        decodedTraceData: DecodedCallData[],
        ensMap: Record<string, string>,
        contractDataMap: Record<string, ContractData>,
        rawTxData: RawTxData | RawTxDataWithoutTrace,
    ): DecodedTx {
        return this.augmenter.augmentDecodedData(
            decodedLogs,
            decodedCallData,
            decodedTraceData,
            ensMap,
            contractDataMap,
            rawTxData,
        )
    }

    /**********************************************/
    /******          INTERPRETING          ********/
    /**********************************************/

    async interpretDecodedTx(
        decoded: DecodedTx,
        userAddress: string | null = null,
        userName: string | null = null,
    ): Promise<Interpretation> {
        return await this.interpreter.interpretSingleTx(decoded, userAddress, userName)
    }

    async interpretDecodedTxArr(
        decodedTxArr: (DecodedTx | null)[],
        userAddress: string | null = null,
        userName: string | null = null,
    ): Promise<(Interpretation | null)[]> {
        return Promise.all(
            decodedTxArr.map(async (decodedTx) => {
                return decodedTx ? await this.interpretDecodedTx(decodedTx, userAddress, userName) : null
            }),
        )
    }

    // If we do this after we've created the example description, we'll have to figure out how to parse any addresses we've turned into a shorter name or onoma name
    // addEnsToInterpretedData(ens: Record<string, string>): Interpretation {
    //     throw new Error('Not implemented')
    // }

    /**********************************************/
    /******            COMBINED            ********/
    /**********************************************/

    async interpretTx(txHash: string, userAddress: string | null = null): Promise<Interpretation> {
        const rawTxData = await this.getRawTxData(txHash)
        const addresses = this.getContractAddressesFromRawTxData(rawTxData)
        const [unfilteredAbiMap, officialContractNamesMap] = await this.getABIsAndNamesForContracts(addresses)
        const proxyAddressMap = await this.getProxyContractMap(addresses)
        const AbiMap = filterABIMap(unfilteredAbiMap)
        const ensMap = await this.getENSNames(addresses)
        const contractDataMap = await this.getContractsData(AbiMap, officialContractNamesMap, proxyAddressMap)

        const { decodedLogs, decodedCallData, decodedTraceData } = await this.decodeTxData(
            rawTxData,
            AbiMap,
            contractDataMap,
        )
        const decodedWithAugmentation = this.augmentDecodedData(
            decodedLogs,
            decodedCallData,
            decodedTraceData,
            ensMap,
            contractDataMap,
            rawTxData,
        )

        const interpretation = this.interpretDecodedTx(decodedWithAugmentation, userAddress)

        return interpretation
    }

    async decodeFromTxHash(txHash: string): Promise<{ decodedTx: DecodedTx; rawTxData: RawTxData }> {
        const logData: LogData = {
            tx_hash: txHash,
        }

        try {
            logData.function_name = 'getRawTxData'
            const rawTxData = await this.getRawTxData(txHash)

            logData.address = rawTxData.txResponse.from

            const contractAddresses = this.getContractAddressesFromRawTxData(rawTxData)

            // const proxyAddressMap = await this.getProxyContractMap(contractAddresses)
            // console.log('proxyAddressMap', proxyAddressMap)

            const proxyAddressMap: Record<string, string> = {}

            const contractAndProxyAddresses = [...contractAddresses, ...getValues(proxyAddressMap)]
            logData.function_name = 'getABIsAndNamesForContracts'
            const [unfilteredAbiMap, officialContractNamesMap] = await this.getABIsAndNamesForContracts(
                contractAndProxyAddresses,
            )

            const contractDataMap = await this.getContractsData(
                unfilteredAbiMap,
                officialContractNamesMap,
                proxyAddressMap,
            )

            // contractDataMap = await this.augmentProxyContractABIs(contractDataMap)

            const AbiMap = filterABIMap(unfilteredAbiMap)
            logData.function_name = 'decodeTxData'
            const { decodedLogs, decodedCallData, decodedTraceData } = await this.decodeTxData(
                rawTxData,
                AbiMap,
                contractDataMap,
            )
            const allAddresses = this.getAllAddresses(decodedLogs, decodedCallData, contractAddresses)

            logData.function_name = 'getENSNames'
            const ensMap = await this.getENSNames(allAddresses)

            const decodedWithAugmentation = this.augmentDecodedData(
                decodedLogs,
                decodedCallData,
                decodedTraceData,
                ensMap,
                contractDataMap,
                rawTxData,
            )

            return { decodedTx: decodedWithAugmentation, rawTxData }
        } catch (error) {
            logError(logData, error)
            throw error
        }
    }

    async decodeFromTxHashArr(txHashArr: string[]): Promise<DecodedTx[]> {
        const promises = txHashArr.map((txHash) => {
            return this.decodeFromTxHash(txHash)
        })

        const results = await Promise.all(promises)

        const decodedTxArr = results.map((result) => result.decodedTx)
        await this.initializeMongoose()
        await this.databaseInterface.addOrUpdateManyDecodedTx(decodedTxArr)

        return decodedTxArr
    }

    async allDataFromTxHash(txHash: string, providedUserAddress: string | null = null): Promise<ActivityData> {
        const logData: LogData = {
            tx_hash: txHash,
        }

        try {
            logData.function_name = 'decodeFromTxHash'
            const { decodedTx, rawTxData } = await this.decodeFromTxHash(txHash)

            const userAddressUnvalidated = providedUserAddress || decodedTx.fromAddress
            const userAddress = AddressZ.parse(userAddressUnvalidated)

            logData.address = userAddress

            logData.function_name = 'getENSName'
            const userName = await this.getENSName(userAddress)

            logData.function_name = 'interpretDecodedTx'
            const interpretation = await this.interpretDecodedTx(decodedTx, userAddress, userName)

            return { interpretedData: interpretation, decodedTx, rawTxData }
        } catch (error) {
            logError(logData, error)
            throw error
        }
    }

    async allDataFromTxHashArr(
        txHashArr: string[],
        userAddressUnvalidated: string | null = null,
    ): Promise<ActivityData[]> {
        const promises = txHashArr.map((txHash) => {
            return this.allDataFromTxHash(txHash, userAddressUnvalidated)
        })

        const results = await Promise.all(promises)

        const decodedTxArr = results.map((result) => result.decodedTx)
        await this.initializeMongoose()
        await this.databaseInterface.addOrUpdateManyDecodedTx(decodedTxArr)

        return results
    }

    /**********************************************/
    /******       DB ONLY CALLs            ********/
    /**********************************************/

    async getManyDecodedTxFromDB(txHashArr: string[]): Promise<(DecodedTx | null)[]> {
        if (!(this.databaseInterface instanceof MongooseDatabaseInterface)) {
            throw new Error('This function only works with MongodB')
        }
        await this.initializeMongoose()
        const map = await this.databaseInterface.getManyDecodedTxMap(txHashArr)
        return getValues(map)
    }

    // public async translateWithTaxData(
    //     addressUnclean: string,
    //     includeInitiatedTxs = true,
    //     includeNotInitiatedTxs = false,
    //     limit = 100,
    // ): Promise<ZenLedgerRow[]> {
    //     try {
    //         const address = addressUnclean.toLowerCase()

    //         const allData = await this.translateFromAddress(address, includeInitiatedTxs, includeNotInitiatedTxs, limit)

    //         const taxFormatter = new TaxFormatter(address, 'brenners wallet', this.config.chain)
    //         const rows = taxFormatter.format(allData)

    //         allData.forEach((element, index) => {
    //             ;(element as ActivityDataWthZenLedger).taxData = rows[index]
    //         })

    //         return rows
    //     } catch (error) {
    //         console.log('error in translateWithTaxData', error)
    //         return []
    //     }
    // }
}

export default Translator
