import { TransactionReceipt, TransactionResponse } from '@ethersproject/abstract-provider'

/* eslint-disable no-unused-vars */
export type Address = `0x${string}`
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

export type RawTxData = {
    transactionResponse: TransactionResponse & { creates: string }
    transactionReceipt: TransactionReceipt
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
    interactions?: Array<Interaction>
}

export type Interaction = {
    contract: string
    contract_symbol: string
    contract_address: string
    events: Array<{ event: string } & Record<string, unknown>>
}

// Generally objective additional info (data hardcoded by humans)
export type Interpreted = {
    contract_name?: string
    action?: Action
    example_description?: string
    tokens_sent?: Token[] // usually just one token
    tokens_received?: Token[] // usually just one token
    ether_sent?: string
    ether_received?: string
}

export type TranslatedActivity = {
    chain: Chain
    explorerUrl: string
    raw: RawTxDataOld
    decoded?: Decoded
    interpreted?: Interpreted
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
