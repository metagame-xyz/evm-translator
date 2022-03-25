import { GetBalancesResponse, GetTransactionsOptions, GetTransactionsResponse } from '@type/covalent'
import axios, { Axios } from 'axios'

export default class covalent {
    #client: Axios
    chainId: number
    constructor(covalentApiKey: string, chainId: number = 1) {
        this.#client = axios.create({
            baseURL: 'https://api.covalenthq.com/v1/',
            auth: {
                username: covalentApiKey,
                password: '',
            },
        })
        this.chainId = chainId //default to 1 for ethereum
    }

    getBalancesFor(address: string, { page, limit }: GetTransactionsOptions = {}): Promise<GetBalancesResponse> {
        return this.#client
            .get(`${this.chainId}/address/${address}/balances_v2/`, {
                params: {
                    'page-size': limit ?? 100,
                    'page-number': page ?? 0,
                },
            })
            .then((res: any) => res.data.data)
    }

    getTransactionsFor(
        address: string,
        { page, limit }: GetTransactionsOptions = {},
    ): Promise<GetTransactionsResponse> {
        return this.#client
            .get(`${this.chainId}/address/${address}/transactions_v2/`, {
                params: {
                    'page-size': limit ?? 100,
                    'page-number': page ?? 0,
                },
            })
            .then((res: any) => res.data.data)
    }

    getTransactionFor(txHash: string): Promise<GetTransactionsResponse> {
        return this.#client.get(`${this.chainId}/transaction_v2/${txHash}/`).then((res: any) => res.data.data)
    }
}
