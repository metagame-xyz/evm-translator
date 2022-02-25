import axios, { Axios } from 'axios'
import { GetTransactionsOptions, GetTransactionsResponse } from '@/types/covalent'

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

	getTransactionsFor(
		address: string,
		{ network, max }: GetTransactionsOptions = {}
	): Promise<GetTransactionsResponse> {
		return this.#client
			.get(`${network ?? 1}/address/${address}/transactions_v2/`, {
				params: {
					'page-size': max ?? 100,
				},
			})
			.then(res => res.data.data)
	}
}

export default new Covalent()
