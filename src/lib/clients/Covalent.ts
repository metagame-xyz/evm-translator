import axios, { Axios } from 'axios'
import { GetBalancesResponse, GetTransactionsOptions, GetTransactionsResponse } from '@/types/covalent'

class Covalent {
	#client: Axios
	constructor() {
		this.#client = axios.create({
			baseURL: 'https://api.covalenthq.com/v1/',
			auth: {
				username: process.env.COVALENT_KEY,
				password: '',
			},
		})
	}

	getBalancesFor(
		address: string,
		{ chainId, page, limit }: GetTransactionsOptions = {}
	): Promise<GetBalancesResponse> {
		return this.#client
			.get(`${chainId ?? 1}/address/${address}/balances_v2/`, {
				params: {
					'page-size': limit ?? 100,
					'page-number': page ?? 0,
				},
			})
			.then(res => res.data.data)
	}

	getTransactionsFor(
		address: string,
		{ chainId, page, limit }: GetTransactionsOptions = {}
	): Promise<GetTransactionsResponse> {
		return this.#client
			.get(`${chainId ?? 1}/address/${address}/transactions_v2/`, {
				params: {
					'page-size': limit ?? 100,
					'page-number': page ?? 0,
				},
			})
			.then(res => res.data.data)
	}
}

export default new Covalent()
