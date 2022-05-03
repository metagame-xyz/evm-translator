import {
    TransactionReceipt as unvalidatedTransactionReceipt,
    TransactionResponse as unvalidatedTransactionResponse,
} from '@ethersproject/providers'
import { BigNumber } from 'ethers'

/* eslint-disable no-unused-vars */
/** 40 char hexadecimal address. Can be an EOA, Contract, or Token address */
export type Address = `0x${string}`

// export type TxHash = `0x${string}`

export type Chain = {
    /** If this transaction is from an EVM-compatible chain. This it true for all, currently */
    EVM: boolean
    /** The chain's id. ETH=1, MATIC=137 */
    id: number
    /** The chain's colloquial name. Ethereum, Polygon */
    name: string
    /** The chain's symbol. ETH, MATIC */
    symbol: string
    /** If this chain is a testnet. */
    testnet: boolean
    /** The block explorer URL for this chain. https://etherscan.io/ */
    blockExplorerUrl: string
    /** The singleton contract address for the wrapped version of the native token. Need to change the variable name */
    wethAddress: Address
    /** The singleton contract address for USDC */
    usdcAddress: Address
    /** The singleton contract address for USDT */
    usdtAddress: Address
    /** The singleton contract address for DAI */
    daiAddress: Address
}

/** Map of EVM chain names to an object with Chain metadata */
export type Chains = Record<string, Chain>

/** The types of transactions an EOA can initiate */
export const enum TxType {
    /** A transaction that sends a native token (ex: ETH) from one address to another */
    TRANSFER = 'native token transfer',
    /** A transaction that deploys a new contract from an EOA (TODO: what about create2?)*/
    CONTRACT_DEPLOY = 'contract deploy',
    /** A transaction that invokes a method on a contract from an EOA */
    CONTRACT_INTERACTION = 'contract interaction',
}

export type TxResponse = Omit<unvalidatedTransactionResponse, 'from' | 'to'> & { from: Address; creates: string }
export type TxReceipt = Omit<unvalidatedTransactionReceipt, 'from' | 'to'> & { from: Address; to: Address }

export type UnvalidatedTraceLog = {
    action: UnvalidatedTraceLogAction
    blockHash: string
    blockNumber: number
    result: {
        gasUsed: string // hex
        output: string // hex
    }
    subtraces: number
    traceAddress: number[]
    transactionHash: string
    transactionPosition: number
    type: string
}

export type UnvalidatedTraceLogAction = {
    callType: string
    from: Address
    to: Address
    gas: string //hex
    input: string //hex
    value: string //hex
}

export type TraceLog = {
    action: TraceLogAction
    blockHash: string
    blockNumber: number
    result: {
        gasUsed: BigNumber // hex
        output: string // hex
    }
    subtraces: number
    traceAddress: number[]
    transactionHash: string
    transactionPosition: number
    type: string
}

export type TraceLogAction = {
    callType: string
    from: Address
    to: Address
    gas: BigNumber //hex
    input: string //hex
    value: BigNumber //hex
}

export type RawTxData = {
    txResponse: TxResponse
    txReceipt: TxReceipt
    txTrace: TraceLog[]
}

export type InProgressActivity = {
    rawTxData?: RawTxData
    decoded?: Decoded
}

export type RawLogEvent = {
    address: Address
    topics: string[]
    data: string
    logIndex: number
}

export const enum ContractType {
    ERC20 = 'ERC20',
    ERC721 = 'ERC721',
    ERC1155 = 'ERC1155',
    WETH = 'WETH',
    OTHER = 'OTHER',
}

//  100% objective additional info (data taken from a blockchain)
export type Decoded = {
    /** The transaction's unique hash */
    txHash: string
    /** The one of three types the transaction can be. TODO switch to required*/
    txType: TxType
    /** The type of contract. An ERC-xx, WETH, or  */
    contractType: ContractType
    /** the name of the function that initiated the transaction. If not decoded, null  */
    contractMethod?: string | null
    contractName?: string
    officialContractName?: string | null
    fromENS?: string | null
    toENS?: string | null
    interactions: Array<Interaction>
    /** The amount of native token (ex: ETH) sent denominated in wei */
    nativeTokenValueSent: string
    /** The symbol for the native token. ex: ETH */
    nativeTokenSymbol: string
    txIndex?: number
    fromAddress: Address
    toAddress?: Address
    reverted?: boolean
    timestamp?: string //
    gasUsed?: string
    effectiveGasPrice?: string
}

export type Interaction = {
    contractName: string | null
    contractSymbol: string | null
    contractAddress: Address
    events: InteractionEvent[]
}

export type InteractionEvent = {
    /** The name of the function that was called */
    eventName: string
    nativeTokenTransfer?: true
    logIndex: number
    params: InteractionEventParams
}

export type InteractionEventParams = {
    value?: string
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

export type UnknownKey = Omit<string, keyof InteractionEvent>

// Generally objective additional info (data hardcoded by humans)

/**
 * Each address that was part of a transaction has its own interpretation of the transaction.
 * native tokens and gas number are denominated in their native token (ex: eth, not wei)
 */
export type Interpretation = {
    txHash: string
    userAddress: Address
    contractName?: string | null
    action?: Action
    exampleDescription: string
    tokensSent: Token[] // usually just one token
    tokensReceived: Token[] // usually just one token
    nativeTokenValueSent: string
    nativeTokenValueReceived: string
    nativeTokenSymbol: string
    userName: string
    counterpartyName?: string // the opposite side of the tx, opposite of userName
    extra: Record<string, any>
    reverted: boolean
    gasPaid: string
}

export type ActivityData = {
    rawTxData: RawTxData
    decodedData: Decoded
    interpretedData: Interpretation
}

export const enum Action {
    received = 'received',
    sent = 'sent',
    minted = 'minted',
    burned = 'burned',
    transferred = 'transferred',
    deployed = 'deployed',
    executed = 'executed',
    bought = 'bought',
    sold = 'sold',
    /** Trading one non-native, non-stablecoin token for another */
    traded = 'traded',
    /** Trading one stablecoin for another, or native token for the wrapped version (but not actually wrapping it using the wrapping contract itself) */
    swapped = 'swapped',
    canceled = 'canceled',
    transferredOwnership = 'transferred ownership',
    receivedOwnership = 'received ownership',
    addedLiquidity = 'added liquidity',
    removedLiquidity = 'removed liquidity',
    claimed = 'claimed',
    contributed = 'contributed',
    redeemed = 'redeemed',
    approved = 'approved',
    revoked = 'revoked',
    gotAirdropped = 'got airdropped',
    ______TODO______ = '______TODO______',
}

export const enum TokenType {
    ERC20 = 'ERC20',
    ERC721 = 'ERC721',
    ERC1155 = 'ERC1155',
    LPToken = 'LPToken',
    DEFAULT = 'unknown',
}
export type Token = {
    type: TokenType
    name: string | null
    symbol: string | null
    address: Address
    amount?: string
    token0?: Token
    token1?: Token
    pair?: string // "RARE-WETH"
    tokenId?: string
}

export type EthersAPIKeys = {
    alchemy: string
    etherscan: string
    infura: string
    pocket: {
        applicationId: string
        applicationSecretKey: string
    }
}
