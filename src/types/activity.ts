import { Address, Chain } from './utils'

export type ActivityData = {
    data: ActivityEntry[]
    pagination?: {
        page: number
        items: number
        last_page: boolean
    }
}

export type ActivityEntry = {
    id: string
    raw: {
        to: Address
        from: Address
        block: number
        value: string
        timestamp: number
        gas_units: number
        gas_price: number
        reverted: boolean
        input: string
    }
    value_in_eth: string
    explorer_url: string
    insights: {
        contractName?: string
        fromENS?: string
        toENS?: string
        generalPurpose?: string
        method?: string
        interactions?: Array<Interaction>
    }
}

export type Activity = {
    source: 'on-chain'
    chain: Chain
    id: string
    raw: {
        to: string
        from: string
        block: number
        value: string
        timestamp: number
        gas_units: number
        gas_price: number
        reverted: boolean
        input: string
    }
    decoded?: Decoded
    interpretation?: Interpretation
    explorer_url: string
    value_in_eth: string
}

//  100% objective additional info (data taken from a blockchain)
export type Decoded = {
    transactionType: TransactionType
    officialContractName?: string
    fromENS?: string
    toENS?: string
    contractMethod?: string
    interactions?: Array<Interaction>
}

export type TransactionType = 'contract_deploy' | 'eth_transfer' | 'contract_interaction'

export type Interaction = {
    contract: string
    contract_symbol: string
    contract_address: string
    details: Array<{ event: string } & Record<string, unknown>>
}

// Generally objective additional info (data hardcoded by humans)
export type Interpretation = {
    contract_name?: string
    action?: Action
    example_description?: string
    tokens_sent?: Token[] // usually just one token
    tokens_received?: Token[] // usually just one token
    ether_sent?: string
    ether_received?: string
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
