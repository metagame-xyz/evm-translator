import { AlchemyProvider } from '@ethersproject/providers'
import { Augmenter } from 'core/Augmenter'
import Interpreter from 'core/Interpreter'
import RawDataFetcher from 'core/RawDataFetcher'
import {
    Address,
    Chain,
    ContractData,
    ContractType,
    Decoded,
    DecodedCallData,
    Interaction,
    Interpretation,
    RawTxData,
    RawTxDataWithoutTrace,
} from 'interfaces'
import { ABI_Item, ABI_ItemUnfiltered } from 'interfaces/abi'
import { EVMTransaction } from 'interfaces/s3'
import { filterABIs, validateAndNormalizeAddress } from 'utils'
import Etherscan from 'utils/clients/Etherscan'
import { DatabaseInterface, NullDatabaseInterface } from 'utils/DatabaseInterface'

export type TranslatorConfigTwo = {
    chain: Chain
    nodeUrl?: string
    alchemyProjectId: string
    etherscanAPIKey: string
    userAddress?: string
    databaseInterface?: DatabaseInterface
}

export type NamesAndSymbolsMap = Record<Address, { name: string | null; symbol: string | null }>

// const defaultConfig: TranslatorConfigTwo = {
//     chain: getChainBySymbol('ETH'),
// }

class Translator2 {
    nodeUrl: string | null
    alchemyProjectId: string
    chain: Chain
    etherscanAPIKey: string
    provider: AlchemyProvider
    rawDataFetcher: RawDataFetcher
    etherscan: Etherscan
    userAddress: Address | null
    augmenter: Augmenter
    interpreter: Interpreter
    databaseInterface: DatabaseInterface

    constructor(config: TranslatorConfigTwo) {
        this.chain = config.chain
        this.nodeUrl = config.nodeUrl || null
        this.alchemyProjectId = config.alchemyProjectId
        this.etherscanAPIKey = config.etherscanAPIKey
        this.userAddress = config.userAddress ? validateAndNormalizeAddress(config.userAddress) : null
        this.provider = this.getProvider()
        this.etherscan = new Etherscan(this.etherscanAPIKey)
        this.databaseInterface = config.databaseInterface || new NullDatabaseInterface()

        this.rawDataFetcher = new RawDataFetcher(this.provider)
        this.augmenter = new Augmenter(this.provider, null, this.etherscan, this.databaseInterface)
        this.interpreter = new Interpreter(config.chain)
    }

    private getProvider(): AlchemyProvider {
        if (this.nodeUrl) {
            throw new Error(
                'the node url option (JsonRpcProvider instead of AlchemyProvider) Not implemented. RawDataFetcher uses AlchemyProvider b/c defaultProvider was throwing errors, and using just Alchemy wasnt throwing errors',
            )
            // return new JsonRpcProvider(this.nodeUrl, this.chain.id)
        }
        if (this.alchemyProjectId) {
            return new AlchemyProvider(this.chain.id, this.alchemyProjectId)
        } else {
            throw new Error('No node url or alchemy project id provided')
        }
    }

    /**********************************************/
    /**** FROM WALLET ADDRESS OR TX HASH ONLY *****/
    /**********************************************/
    updateUserAddress(userAddress: string) {
        this.userAddress = validateAndNormalizeAddress(userAddress)
    }

    // Gets the txResponse, txReceipt, txTrace from a node. Archive node needed
    async getRawTxData(txHash: string): Promise<RawTxData> {
        return this.rawDataFetcher.getTxData(txHash)
    }

    async getRawTxDataWithoutTrace(txHash: string): Promise<RawTxDataWithoutTrace> {
        return this.rawDataFetcher.getTxDataWithoutTrace(txHash)
    }

    getRawDataFromS3Data(tx: EVMTransaction, timestamp: number): RawTxDataWithoutTrace {
        return this.rawDataFetcher.getTxDataFromS3Tx(tx, timestamp)
    }

    // Could rely on Etherscan, but they have a max of 10k records
    // async getAllTxHashesForAddress(address: string): Promise<string[]> {
    //     throw new Error('Not implemented')
    // }

    getContractAddressesFromRawTxData(rawTxData: RawTxData | RawTxDataWithoutTrace): Address[] {
        return RawDataFetcher.getContractAddressesFromRawTxData(rawTxData)
    }

    getAllAddresses(
        decodedLogs: Interaction[],
        decodedCallData: DecodedCallData,
        contractAddresses: Address[],
    ): Address[] {
        return Augmenter.getAllAddresses(decodedLogs, decodedCallData, contractAddresses)
    }

    /**********************************************/
    /**** USING TX AND CONTRACT ADDRESSES  ********/
    /****  Data used to decode & augment   ********/
    /**********************************************/
    async getABIsAndNamesForContracts(
        contractAddresses: Address[],
    ): Promise<[Record<Address, ABI_ItemUnfiltered[]>, Record<Address, string | null>]> {
        return this.augmenter.getABIsAndNamesForContracts(contractAddresses)
    }

    async getNameAndSymbol(
        address: string,
        contractType: ContractType,
    ): Promise<{ tokenName: string | null; tokenSymbol: string | null; contractName: string | null }> {
        return this.augmenter.getNameAndSymbol(address, contractType)
    }

    async getENSNames(addresses: Address[]): Promise<Record<Address, string>> {
        return this.augmenter.getENSNames(addresses)
    }

    async getOfficialNamesForContracts(contractAddresses: string[]): Promise<Record<Address, string>> {
        throw new Error('Not implemented')
    }

    async getContractName(address: string): Promise<string | null> {
        throw new Error('Not implemented')
    }

    async getContractsData(
        contractToAbiMap: Record<Address, ABI_ItemUnfiltered[]>,
        contractToOfficialNameMap: Record<Address, string | null>,
    ): Promise<Record<Address, ContractData>> {
        return this.augmenter.getContractsData(contractToAbiMap, contractToOfficialNameMap)
    }

    // We should store this in a contracts table just so we can see this data more easily
    getContractType(address: Address, abi: ABI_Item[]): Promise<ContractType> {
        return this.augmenter.getContractType(address, abi)
    }

    getContractTypes(contractToAbiMap: Record<Address, ABI_Item[]>): Promise<Record<Address, ContractType>> {
        throw new Error('Not implemented')
    }
    /**********************************************/
    /******      DECODING / AUGMENTING     ********/
    /**********************************************/
    decodeTxData(
        rawTxData: RawTxData | RawTxDataWithoutTrace,
        ABIs: Record<Address, ABI_Item[]>,
        contractDataMap: Record<Address, ContractData>,
    ): { decodedLogs: Interaction[]; decodedCallData: DecodedCallData } {
        return this.augmenter.decodeTxData(rawTxData, ABIs, contractDataMap)
    }

    decodeTxDataArr(rawTxDataArr: RawTxData[], ABIs: Record<Address, ABI_Item[]>[]): Decoded[] {
        throw new Error('Not implemented')
    }

    augmentDecodedData(
        decodedLogs: Interaction[],
        decodedCallData: DecodedCallData,
        ensMap: Record<Address, string>,
        contractDataMap: Record<Address, ContractData>,
        rawTxData: RawTxData | RawTxDataWithoutTrace,
    ): Decoded {
        return this.augmenter.augmentDecodedData(decodedLogs, decodedCallData, ensMap, contractDataMap, rawTxData)
    }

    //This is a subset of augmentDecodedData
    // addEnsToDecodedData(decoded: Decoded, ens: Record<Address, string>): Decoded {
    //     throw new Error('Not implemented')
    // }

    /**********************************************/
    /******          INTERPRETING          ********/
    /**********************************************/

    interpretDecodedTx(decoded: Decoded, userAddress: Address | null = null): Interpretation {
        return this.interpreter.interpretSingleTx(decoded, userAddress)
    }

    // If we do this after we've created the example description, we'll have to figure out how to parse any addresses we've turned into a shorter name or onoma name
    // addEnsToInterpretedData(ens: Record<Address, string>): Interpretation {
    //     throw new Error('Not implemented')
    // }

    async interpretTx(txHash: string, userAddress: Address | null = null): Promise<Interpretation> {
        const rawTxData = await this.getRawTxData(txHash)
        const addresses = this.getContractAddressesFromRawTxData(rawTxData)
        const [unfilteredAbiMap, officialContractNamesMap] = await this.getABIsAndNamesForContracts(addresses)
        const AbiMap = filterABIs(unfilteredAbiMap)
        const ensMap = await this.getENSNames(addresses)
        const contractDataMap = await this.getContractsData(AbiMap, officialContractNamesMap)

        const { decodedLogs, decodedCallData } = this.decodeTxData(rawTxData, AbiMap, contractDataMap)
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
}

export default Translator2
