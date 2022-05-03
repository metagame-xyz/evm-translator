import { AlchemyProvider, BaseProvider, getDefaultProvider, JsonRpcProvider } from '@ethersproject/providers'
import { Address, Chain, ContractType, Decoded, RawTxData } from 'interfaces'
import { ABI_Item, ABI_ItemUnfiltered } from 'interfaces/abi'
import { getChainById, getChainBySymbol, validateAndNormalizeAddress } from 'utils'

type TranslatorConfig = {
    chain: Chain
    nodeUrl?: string
    alchemyProjectId?: string
    etherscanAPIKey?: string
    userAddress?: string
}

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

    /** Gets the txResponse, txReceipt, txTrace from a node. Archive node needed */
    async getRawTxData(txHash: string): Promise<RawTxData> {
        throw new Error('Not implemented')
    }

    /** Could rely on Etherscan, but they have a max of 10k records */
    // async getAllTxHashesForAddress(address: string): Promise<string[]> {
    //     throw new Error('Not implemented')
    // }

    getContractAddressesFromRawTxData(rawTxData: RawTxData): Address[] {
        throw new Error('Not implemented')
    }

    /**********************************************/
    /**** USING TX AND CONTRACT ADDRESSES  ********/

    async getABIsForContracts(contractAddresses: string[]): Promise<Record<Address, ABI_ItemUnfiltered[]>> {
        throw new Error('Not implemented')
    }

    async getNameAndSymbol(address: string): Promise<{ name: string; symbol: string }> {
        throw new Error('Not implemented')
    }

    async getNamesAndSymbols(
        contractAddresses: string[],
    ): Promise<Record<Address, { name: string | null; symbol: string | null }>> {
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

    async getNamesForContracts(contractAddresses: string[]): Promise<any[]> {
        throw new Error('Not implemented')
    }

    decodeTxData(rawTxData: RawTxData, ABIs: Record<Address, ABI_Item[]>): Decoded {
        throw new Error('Not implemented')
    }

    decodeTxDataArr(rawTxDataArr: RawTxData[], ABIs: Record<Address, ABI_Item[]>[]): Decoded[] {
        throw new Error('Not implemented')
    }

    /** We should store this in a contracts table just so we can see this data more easily */
    getContractType(address: string, abi: ABI_Item[]): Promise<ContractType> {
        throw new Error('Not implemented')
    }
}

export default Translator
