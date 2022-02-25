export type GetTransactionsOptions = {
	network?: 1 | 137
	max?: number
}

export type GetTransactionsResponse = {
	address: string
	updated_at: string
	next_update_at: string
	chain_id: number
	items: Array<TxData>
	pagination: {
		has_more: boolean
		page_number: number
		page_size: number
	}
}

export type TxData = {
	block_signed_at: Date
	block_height: number
	tx_hash: string
	tx_offset: number
	successful: boolean
	from_address: string
	from_address_label?: any
	to_address: string
	to_address_label?: any
	value: string
	value_quote: number
	gas_offered: number
	gas_spent: number
	gas_price: any
	gas_quote: number
	gas_quote_rate: number
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
