import { Address } from 'type'

export type GetTransactionsOptions = {
    page?: number
    limit?: number
    chainId?: string
}

export type CovalentConfig = {
    chainId?: string
    page?: number
    limit?: number
}

type CovalentResponse<T> = {
    address: string
    updated_at: string
    next_update_at: string
    quote_currency: string
    chain_id: number
    items: Array<T>
    pagination: {
        has_more: boolean
        page_number: number
        page_size: number
    }
}

export type GetTransactionsResponse = CovalentResponse<TxData>

export type GetBalancesResponse = CovalentResponse<TokenBalance>

type ERC = 'erc20' | 'erc721'

export type TokenBalance = {
    contract_decimals: number
    contract_name: string
    contract_ticker_symbol: string
    contract_address: string
    supports_erc?: ERC[]
    logo_url: string
    last_transferred_at: Date
    type: 'cryptocurrency' | 'dust'
    balance: string
    balance_24h: string
    quote_rate: number
    quote_rate_24h?: any
    quote: number
    quote_24h?: any
    nft_data?: Array<{
        token_id: string
        token_balance: string
        token_url: string
        supports_erc: ERC[]
        token_price_wei?: any
        token_quote_rate_eth?: any
        original_owner: string
        external_data: {
            name: string
            description: string
            image: string
            image_256: string
            image_512: string
            image_1024: string
            animation_url?: string
            external_url: string
            attributes: Array<{
                trait_type: string
                value: string
            }>
            owner?: string
        }
        owner: string
        owner_address?: string
        burned?: boolean
    }>
}

export type TxData = {
    block_signed_at: Date
    block_height: number
    tx_hash: string
    tx_offset: number
    successful: boolean
    from_address: Address
    from_address_label?: any
    to_address: Address
    to_address_label?: any
    value: string
    value_quote: number
    gas_offered: number
    gas_spent: number
    gas_price: any
    gas_quote: number
    gas_quote_rate: number
    data?: string
    creates?: string
    log_events: Array<{
        block_signed_at: Date
        block_height: number
        tx_offset: number
        log_offset: number
        tx_hash: string
        raw_log_topics: string[]
        sender_contract_decimals: number
        sender_name: string
        sender_contract_ticker_symbol: string
        sender_address: string
        sender_address_label?: any
        sender_logo_url: string
        raw_log_data: string
        decoded: {
            name: string
            signature: string
            params: Array<{
                name: string
                type: string
                indexed: boolean
                decoded: boolean
                value: any
            }>
        }
    }>
}
