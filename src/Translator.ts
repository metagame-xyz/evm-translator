import { AlchemyConfig, initializeAlchemy, Network } from '@alch/alchemy-sdk'
import { AlchemyProvider } from '@ethersproject/providers'

import {
    ActivityData,
    Chain,
    ContractData,
    ContractType,
    Decoded,
    DecodedCallData,
    Interaction,
    Interpretation,
} from 'interfaces'
import { ABI_Item, ABI_ItemUnfiltered } from 'interfaces/abi'
import { RawTxData, RawTxDataWithoutTrace } from 'interfaces/RawData'
import { EVMTransaction } from 'interfaces/s3'
import { AddressZ } from 'interfaces/utils'

import { filterABIMap, getProxyAddresses, getValues } from 'utils'
import Covalent from 'utils/clients/Covalent'
import Etherscan, { EtherscanServiceLevel } from 'utils/clients/Etherscan'
import { DatabaseInterface, NullDatabaseInterface } from 'utils/DatabaseInterface'
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
        this.interpreter = new Interpreter(config.chain)
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
            const settings = {
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

    /**********************************************/
    /**** FROM WALLET ADDRESS OR TX HASH ONLY *****/
    /**********************************************/
    updateUserAddress(userAddress: string) {
        this.userAddress = AddressZ.parse(userAddress)
    }

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

    getAllAddresses(
        decodedLogs: Interaction[],
        decodedCallData: DecodedCallData,
        contractAddresses: string[],
    ): string[] {
        return Augmenter.getAllAddresses(decodedLogs, decodedCallData, contractAddresses)
    }

    /**********************************************/
    /**** USING TX AND CONTRACT ADDRESSES  ********/
    /****  Data used to decode & augment   ********/
    /**********************************************/
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

    async getENSNames(addresses: string[]): Promise<Record<string, string>> {
        return this.augmenter.getENSNames(addresses)
    }

    async getOfficialNamesForContracts(contractAddresses: string[]): Promise<Record<string, string>> {
        throw new Error('Not implemented')
    }

    async getContractName(address: string): Promise<string | null> {
        throw new Error('Not implemented')
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

    getContractTypes(contractToAbiMap: Record<string, ABI_Item[]>): Promise<Record<string, ContractType>> {
        throw new Error('Not implemented')
    }
    /**********************************************/
    /******      DECODING / AUGMENTING     ********/
    /**********************************************/
    async decodeTxData(
        rawTxData: RawTxData | RawTxDataWithoutTrace,
        ABIs: Record<string, ABI_Item[]>,
        contractDataMap: Record<string, ContractData>,
    ): Promise<{ decodedLogs: Interaction[]; decodedCallData: DecodedCallData }> {
        return await this.augmenter.decodeTxData(rawTxData, ABIs, contractDataMap)
    }

    decodeTxDataArr(rawTxDataArr: RawTxData[], ABIs: Record<string, ABI_Item[]>[]): Decoded[] {
        throw new Error('Not implemented')
    }

    augmentDecodedData(
        decodedLogs: Interaction[],
        decodedCallData: DecodedCallData,
        ensMap: Record<string, string>,
        contractDataMap: Record<string, ContractData>,
        rawTxData: RawTxData | RawTxDataWithoutTrace,
    ): Decoded {
        return this.augmenter.augmentDecodedData(decodedLogs, decodedCallData, ensMap, contractDataMap, rawTxData)
    }

    //This is a subset of augmentDecodedData
    // addEnsToDecodedData(decoded: Decoded, ens: Record<string, string>): Decoded {
    //     throw new Error('Not implemented')
    // }

    /**********************************************/
    /******          INTERPRETING          ********/
    /**********************************************/

    interpretDecodedTx(
        decoded: Decoded,
        userAddress: string | null = null,
        userName: string | null = null,
    ): Interpretation {
        return this.interpreter.interpretSingleTx(decoded, userAddress, userName)
    }

    // If we do this after we've created the example description, we'll have to figure out how to parse any addresses we've turned into a shorter name or onoma name
    // addEnsToInterpretedData(ens: Record<string, string>): Interpretation {
    //     throw new Error('Not implemented')
    // }

    async interpretTx(txHash: string, userAddress: string | null = null): Promise<Interpretation> {
        const rawTxData = await this.getRawTxData(txHash)
        const addresses = this.getContractAddressesFromRawTxData(rawTxData)
        const [unfilteredAbiMap, officialContractNamesMap] = await this.getABIsAndNamesForContracts(addresses)
        const proxyAddressMap = await this.getProxyContractMap(addresses)
        const AbiMap = filterABIMap(unfilteredAbiMap)
        const ensMap = await this.getENSNames(addresses)
        const contractDataMap = await this.getContractsData(AbiMap, officialContractNamesMap, proxyAddressMap)

        const { decodedLogs, decodedCallData } = await this.decodeTxData(rawTxData, AbiMap, contractDataMap)
        const decodedWithAugmentation = this.augmentDecodedData(
            decodedLogs,
            decodedCallData,
            ensMap,
            contractDataMap,
            rawTxData,
        )

        const interpretation = this.interpretDecodedTx(decodedWithAugmentation, userAddress)

        return interpretation
    }

    async allDataFromTxHash(txHash: string, providedUserAddress: string | null = null): Promise<ActivityData> {
        const rawTxData = await this.getRawTxData(txHash)

        const userAddressUnvalidated = providedUserAddress || rawTxData.txResponse.from

        const userAddress = AddressZ.parse(userAddressUnvalidated)

        const contractAddresses = this.getContractAddressesFromRawTxData(rawTxData)

        // const proxyAddressMap = await this.getProxyContractMap(contractAddresses)
        // console.log('proxyAddressMap', proxyAddressMap)

        const proxyAddressMap: Record<string, string> = {}

        const contractAndProxyAddresses = [...contractAddresses, ...getValues(proxyAddressMap)]
        const [unfilteredAbiMap, officialContractNamesMap] = await this.getABIsAndNamesForContracts(
            contractAndProxyAddresses,
        )

        const contractDataMap = await this.getContractsData(unfilteredAbiMap, officialContractNamesMap, proxyAddressMap)

        // contractDataMap = await this.augmentProxyContractABIs(contractDataMap)

        const AbiMap = filterABIMap(unfilteredAbiMap)
        const { decodedLogs, decodedCallData } = await this.decodeTxData(rawTxData, AbiMap, contractDataMap)

        const allAddresses = this.getAllAddresses(decodedLogs, decodedCallData, contractAddresses)

        const ensMap = await this.getENSNames(allAddresses)

        const decodedWithAugmentation = this.augmentDecodedData(
            decodedLogs,
            decodedCallData,
            ensMap,
            contractDataMap,
            rawTxData,
        )

        const userName = ensMap[userAddress || ''] || null

        const interpretation = this.interpretDecodedTx(decodedWithAugmentation, userAddress, userName)

        return { interpretedData: interpretation, decodedData: decodedWithAugmentation, rawTxData }
    }

    async allDataFromTxHashArr(
        txHashArr: string[],
        userAddressUnvalidated: string | null = null,
    ): Promise<ActivityData[]> {
        const promises = txHashArr.map((txHash) => {
            return this.allDataFromTxHash(txHash, userAddressUnvalidated)
        })

        const results = await Promise.all(promises)

        return results
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
