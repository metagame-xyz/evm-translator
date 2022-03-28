import { TransactionReceipt, TransactionResponse } from '@ethersproject/abstract-provider'
import { BaseProvider, Formatter } from '@ethersproject/providers'
import { RawTxData } from '@interfaces'

export class RawDataFetcher {
    provider: BaseProvider
    formatter = new Formatter()

    constructor(provider: BaseProvider) {
        this.provider = provider
    }

    async getTxResponse(txHash: string): Promise<TransactionResponse & { creates: string }> {
        const txData = this.formatter.transactionResponse(
            await this.provider.getTransaction(txHash),
        ) as TransactionResponse & {
            creates: string
        }

        return txData
    }

    async getTxReciept(txHash: string): Promise<TransactionReceipt> {
        const txReceipt = await this.provider.getTransactionReceipt(txHash)
        return txReceipt
    }

    // could be parallelized, but each has a different dependency graph
    async getTxData(txHash: string): Promise<RawTxData> {
        const txResponse = await this.getTxResponse(txHash)
        const txReceipt = await this.getTxReciept(txHash)

        return {
            transactionResponse: txResponse,
            transactionReceipt: txReceipt,
        }
    }
}
