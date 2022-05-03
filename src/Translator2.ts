import { AlchemyProvider, BaseProvider, getDefaultProvider, JsonRpcProvider } from '@ethersproject/providers'
import { Address, Chain, ContractType, Decoded, Interpretation, RawTxData } from 'interfaces'
import { ABI_Item, ABI_ItemUnfiltered } from 'interfaces/abi'
import { getChainById, getChainBySymbol, validateAndNormalizeAddress } from 'utils'

type TranslatorConfig = {
    chain: Chain
    nodeUrl?: string
    alchemyProjectId?: string
    etherscanAPIKey?: string
    userAddress?: string
}

type NamesAndSymbolsMap = Record<Address, { name: string | null; symbol: string | null }>

const defaultConfig: TranslatorConfig = {
    chain: getChainBySymbol('ETH'),
}

class Translator {
    nodeUrl: string | null
    alchemyProjectId: string | null
    chain: Chain
    etherscanAPIKey: string | null
    provider: JsonRpcProvider | AlchemyProvider
    userAddress: Address | null

    constructor(config: TranslatorConfig) {
        this.chain = config.chain
        this.nodeUrl = config.nodeUrl || null
        this.alchemyProjectId = config.alchemyProjectId || null
        this.etherscanAPIKey = config.etherscanAPIKey || null
        this.userAddress = config.userAddress ? validateAndNormalizeAddress(config.userAddress) : null
        this.provider = this.getProvider()
    }

    private getProvider(): JsonRpcProvider | AlchemyProvider {
        if (this.nodeUrl) {
            return new JsonRpcProvider(this.nodeUrl, this.chain.id)
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
        throw new Error('Not implemented')
    }

    // Could rely on Etherscan, but they have a max of 10k records
    // async getAllTxHashesForAddress(address: string): Promise<string[]> {
    //     throw new Error('Not implemented')
    // }

    getContractAddressesFromRawTxData(rawTxData: RawTxData): Address[] {
        throw new Error('Not implemented')
    }

    /**********************************************/
    /**** USING TX AND CONTRACT ADDRESSES  ********/
    /****  Data used to decode & augment   ********/
    /**********************************************/
    async getABIsForContracts(contractAddresses: string[]): Promise<Record<Address, ABI_ItemUnfiltered[]>> {
        throw new Error('Not implemented')
    }

    async getNameAndSymbol(address: string): Promise<{ name: string; symbol: string }> {
        throw new Error('Not implemented')
    }

    async getNamesAndSymbols(contractAddresses: string[]): Promise<NamesAndSymbolsMap> {
        throw new Error('Not implemented')
    }

    async getEnsForAddresses(addresses: string[]): Promise<Record<Address, string>> {
        throw new Error('Not implemented')
    }

    async getOfficialNamesForContracts(contractAddresses: string[]): Promise<Record<Address, string>> {
        throw new Error('Not implemented')
    }

    // We should store this in a contracts table just so we can see this data more easily
    getContractType(address: string, abi: ABI_Item[]): Promise<ContractType> {
        throw new Error('Not implemented')
    }

    getContractTypes(contractToAbiMap: Record<Address, ABI_Item[]>): Promise<Record<Address, ContractType>> {
        throw new Error('Not implemented')
    }
    // ... might not even needs this, oops
    filterABIs(unfilteredABIs: Record<string, ABI_ItemUnfiltered[]>): Record<Address, ABI_Item[]> {
        const filteredABIs: Record<Address, ABI_Item[]> = {}

        for (const [addressStr, unfilteredABI] of Object.entries(unfilteredABIs)) {
            const address = validateAndNormalizeAddress(addressStr)
            const abi = unfilteredABI.filter(({ type }) => type === 'function' || type === 'event') as ABI_Item[]
            filteredABIs[address] = abi
        }

        return filteredABIs
    }

    /**********************************************/
    /******      DECODING / AUGMENTING     ********/
    /**********************************************/
    decodeTxData(rawTxData: RawTxData, ABIs: Record<Address, ABI_Item[]>): Decoded {
        throw new Error('Not implemented')
    }

    decodeTxDataArr(rawTxDataArr: RawTxData[], ABIs: Record<Address, ABI_Item[]>[]): Decoded[] {
        throw new Error('Not implemented')
    }

    augmentDecodedData(
        decodedData: Decoded,
        ens: Record<Address, string>,
        namesAndSymbolsMap: NamesAndSymbolsMap,
        officialContractNamesMap: Record<Address, string>,
        contractTypesMap: Record<Address, ContractType>,
    ): Decoded {
        throw new Error('Not implemented')
    }

    //This is a subset of augmentDecodedData
    // addEnsToDecodedData(decoded: Decoded, ens: Record<Address, string>): Decoded {
    //     throw new Error('Not implemented')
    // }

    /**********************************************/
    /******          INTERPRETING          ********/
    /**********************************************/

    interpretDecodedTx(decoded: Decoded, userAddress: Address | null = null): Interpretation {
        throw new Error('Not implemented')
    }

    // If we do this after we've created the example description, we'll have to figure out how to parse any addresses we've turned into a shorter name or onoma name
    // addEnsToInterpretedData(ens: Record<Address, string>): Interpretation {
    //     throw new Error('Not implemented')
    // }

    async interpretTx(txHash: string, userAddress: Address | null = null): Promise<Interpretation> {
        const rawTxData = await this.getRawTxData(txHash)
        const addresses = this.getContractAddressesFromRawTxData(rawTxData)
        const unfilteredAbiMap = await this.getABIsForContracts(addresses)
        const AbiMap = this.filterABIs(unfilteredAbiMap)
        const ENSs = await this.getEnsForAddresses(addresses)
        const nameAndSymbols = await this.getNamesAndSymbols(addresses)
        const officialContractNames = await this.getOfficialNamesForContracts(addresses)
        const contractTypesMap = await this.getContractTypes(AbiMap)

        const decoded = this.decodeTxData(rawTxData, AbiMap)
        const decodedWithAugmentation = this.augmentDecodedData(
            decoded,
            ENSs,
            nameAndSymbols,
            officialContractNames,
            contractTypesMap,
        )

        const interpretation = this.interpretDecodedTx(decodedWithAugmentation, userAddress)

        return interpretation
    }
}

export default Translator