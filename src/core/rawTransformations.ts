import { TransactionReceipt, TransactionResponse } from '@ethersproject/abstract-provider'
import { BaseProvider, Formatter } from '@ethersproject/providers'
import { Address, RawTxData, RawTxDataOld } from '@interfaces'
import { CovalentTxData } from '@interfaces/covalent'

export function covalentToRawTxData(rawCovalentData: CovalentTxData): RawTxDataOld {
    const rawtxData: RawTxDataOld = {
        txHash: rawCovalentData.tx_hash,
        txIndex: rawCovalentData.tx_offset,
        to: rawCovalentData.to_address,
        from: rawCovalentData.from_address,
        block: rawCovalentData.block_height,
        value: rawCovalentData.value,
        timestamp: rawCovalentData.block_signed_at,
        gas_units: rawCovalentData.gas_spent,
        gas_price: rawCovalentData.gas_price,
        successful: rawCovalentData.successful,
        input: rawCovalentData.data || null,
        log_events: rawCovalentData.log_events.map((log) => ({
            address: log.sender_address as Address,
            topics: log.raw_log_topics,
            data: log.raw_log_data,
            logIndex: log.log_offset,
        })),
    }

    return rawtxData
}

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
