import {
    TransactionReceipt as unvalidatedTransactionReceipt,
    TransactionResponse as unvalidatedTransactionResponse,
} from '@ethersproject/providers'

/* eslint-disable no-unused-vars */
export type Address = `0x${string}`
export type TxHash = `0x${string}`
export type Chain = {
    EVM: boolean
    id: number
    name: string
    symbol: string
    testnet: boolean
    blockExplorerUrl: string
}

export type Chains = Record<string, Chain>

export enum TX_TYPE {
    TRANSFER = 'native token transfer',
    CONTRACT_DEPLOY = 'contract deploy',
    CONTRACT_INTERACTION = 'contract interaction',
}

export type TxResponse = unvalidatedTransactionResponse & { from: Address; creates: string }
export type TxReceipt = unvalidatedTransactionReceipt & { from: Address; to: Address }

export type RawTxData = {
    txResponse: TxResponse
    txReceipt: TxReceipt
}

export type InProgressActivity = {
    rawTxData?: RawTxData
    decoded?: Decoded
}

export type RawTxDataOld = {
    txHash: string
    txIndex: number
    to: Address
    from: Address
    block: number
    value: string
    timestamp: Date
    gas_units: number
    gas_price: number
    successful: boolean
    input: string | null
    log_events: RawLogEvent[]
}

export type RawLogEvent = {
    address: Address
    topics: string[]
    data: string
    logIndex: number
}

//  100% objective additional info (data taken from a blockchain)
export type Decoded = {
    txType?: TX_TYPE
    contractMethod?: string
    contractName?: string
    officialContractName?: string
    fromENS?: string | null
    toENS?: string | null
    interactions: Array<Interaction>
    nativeTokenValueSent?: string
    nativeTokenValueReceived?: string // so hard to get this
    nativeTokenSymbol?: string
    txIndex?: number
    fromAddress?: Address
    toAddress?: Address

    reverted?: boolean
    timestamp?: number

    gasUsed?: string
    effectiveGasPrice?: string
}

export type Interaction = {
    contractName: string
    contractSymbol: string
    contractAddress: string
    events: Array<InteractionEvent>
}

export type InteractionEvent = { event: string; logIndex: number; value?: string } & Record<string, unknown>

// Generally objective additional info (data hardcoded by humans)
export type Interpretation = {
    contractName?: string
    action?: Action
    exampleDescription?: string
    tokensSent?: Token[] // usually just one token
    tokensReceived?: Token[] // usually just one token
    nativeTokenValueSent?: string
    nativeTokenValueReceived?: string
    nativeTokenSymbol?: string
}

export type TranslatedActivity = {
    chain: Chain
    explorerUrl: string
    raw: RawTxDataOld
    decoded?: Decoded
    interpretation?: Interpretation
}

export type Action =
    | 'received'
    | 'sent'
    | 'minted'
    | 'burned'
    | 'transferred'
    | 'deployed'
    | 'executed'
    | 'bought'
    | 'sold'
    | 'canceled'
    | 'transferred ownership'
    | 'received ownership'
    | 'added liquidity'
    | 'removed liquidity'
    | 'claimed'
    | 'contributed'
    | 'redeemed'

export enum TokenType {
    ERC20 = 'ERC20',
    ERC721 = 'ERC721',
    ERC1155 = 'ERC1155',
    LPToken = 'LPToken',
    DEFAULT = 'unknown',
}
export type Token = {
    type: TokenType
    name: string
    symbol: string
    address: string
    amount?: string
    token0?: Token
    token1?: Token
    pair?: string // "RARE-WETH"
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
