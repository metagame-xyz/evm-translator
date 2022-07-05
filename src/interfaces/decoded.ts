import { ABI_ItemUnfiltered } from './abi'
import { RawTxData } from './rawData'

/** The types of transactions an EOA can initiate */
export const enum TxType {
    /** A transaction that sends a native token (ex: ETH) from one address to another */
    TRANSFER = 'native token transfer',
    /** A transaction that deploys a new contract from an EOA (TODO: what about create2?)*/
    CONTRACT_DEPLOY = 'contract deploy',
    /** A transaction that invokes a method on a contract from an EOA */
    CONTRACT_INTERACTION = 'contract interaction',
}

export type InProgressActivity = {
    rawTxData?: RawTxData
    decoded?: DecodedTx
}

export type RawLogEvent = {
    address: string
    topics: string[]
    data: string
    logIndex: number
}

export type ContractData = {
    address: string
    type: ContractType
    tokenName: string | null
    tokenSymbol: string | null
    contractName: string | null
    contractOfficialName: string | null
    abi: ABI_ItemUnfiltered[]
    proxyAddress: string | null
    txCount: number | null
}

export const enum ContractType {
    ERC20 = 'ERC20',
    ERC721 = 'ERC721',
    ERC1155 = 'ERC1155',
    WETH = 'WETH',
    GNOSIS = 'Gnosis Safe',
    OTHER = 'OTHER',
}

//  100% objective additional info (data taken from a blockchain)
export type DecodedTx = {
    /** The transaction's unique hash */
    txHash: string
    /** The one of three types the transaction can be. TODO switch to required*/
    txType: TxType
    /** The type of contract. An ERC-xx, WETH, or  */
    contractType: ContractType
    /** the name of the function that initiated the transaction. If not decoded, null  */
    methodCall: MethodCall
    traceCalls: DecodedCallData[]
    // contractMethod: string | null
    // contractMethodArguments: Record<string, MostTypes>
    contractName: string | null
    officialContractName: string | null
    fromENS: string | null
    toENS: string | null
    interactions: Array<Interaction>
    /** The amount of native token (ex: ETH) sent denominated in wei */
    nativeValueSent: string
    /** The symbol for the native token. ex: ETH */
    chainSymbol: string
    txIndex: number
    fromAddress: string
    toAddress: string | null
    reverted: boolean
    timestamp: number
    gasUsed: string
    effectiveGasPrice: string | null
}

export type MethodCall = {
    name: string | null
    arguments: Record<string, MostTypes>
    decoded?: boolean
}

export type Interaction = {
    contractName: string | null
    contractSymbol: string | null
    contractAddress: string
    contractType: ContractType
    events: InteractionEvent[]
}

export type InteractionEvent = {
    /** The name of the function that was called */
    eventName: string | null
    nativeTransfer?: true
    logIndex: number | null
    params: InteractionEventParams
    decoded?: boolean
}

export type InteractionEventParams = {
    value?: string
    amount?: string
    wad?: string
    from?: string
    _from?: string
    fromENS?: string
    _fromENS?: string
    to?: string
    _to?: string
    toENS?: string
    _toENS?: string
    _owner?: string
    _ownerENS?: string
    _operator?: string
    _operatorENS?: string
    _approved?: string
    _approvedENS?: string
    _value?: string
    tokenId?: string
    _tokenId?: string
    _amount?: string
    _amounts?: string[]
    _ids?: string[]
    _id?: string | null
    [key: string]: string | string[] | undefined | null | number | boolean
}

export type RawDecodedLogEvent = {
    name: string
    type: string
    value: string | string[]
}

export type RawDecodedLog = {
    name: string | null
    address: string
    logIndex: number
    events: RawDecodedLogEvent[]
    decoded: boolean
}

export type RawDecodedCallData = {
    name: string | null
    from?: string
    to?: string
    params: {
        name: string
        type: string
        value: string | number | boolean | null | string[]
    }[]
}

export type DecodedCallData = {
    name: string | null
    params: Record<string, MostTypes>
    decoded?: boolean
}

export type MostTypes = string | number | boolean | null | string[]
