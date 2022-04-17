import axios, { Axios } from 'axios'
import { Address } from 'interfaces'
import {
    CovalentTxData,
    GetBalancesResponse,
    GetTransactionsOptions,
    GetTransactionsResponse,
} from 'interfaces/covalent'

export default class Covalent {
    client: Axios
    chainId: number
    constructor(covalentApiKey: string, chainId = 1) {
        this.client = axios.create({
            baseURL: 'https://api.covalenthq.com/v1/',
            auth: {
                username: covalentApiKey,
                password: '',
            },
        })
        this.chainId = chainId // default to 1 for ethereum
    }

    getBalancesFor(address: string, { page, limit }: GetTransactionsOptions = {}): Promise<GetBalancesResponse> {
        return this.client
            .get(`${this.chainId}/address/${address}/balances_v2/`, {
                params: {
                    'page-size': limit ?? 100,
                    'page-number': page ?? 0,
                },
            })
            .then((res: any) => res.data.data)
    }

    // TODO pagination loop logic should live in here, with a txn count limit optional param
    getTransactionsFor(address: Address, limit: number): Promise<CovalentTxData[]> {
        return this.client
            .get(`${this.chainId}/address/${address}/transactions_v2/`, {
                params: {
                    'page-size': limit ?? 999999,
                    'page-number': 0,
                },
            })
            .then((res: any) => {
                if (res.data.data.pagination.has_more) {
                    console.log('Theres more transactions to fetch from Covalent!')
                }
                return res.data.data.items
            })
    }

    getTransactionFor(txHash: string): Promise<GetTransactionsResponse> {
        return this.client.get(`${this.chainId}/transaction_v2/${txHash}/`).then((res: any) => res.data.data)
    }
}
