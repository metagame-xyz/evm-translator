import {
    BaseProvider,
    Formatter,
    TransactionReceipt as unvalidatedTransactionReceipt,
    TransactionResponse as unvalidatedTransactionResponse,
} from '@ethersproject/providers'
import { Address, RawTxData, TxReceipt, TxResponse } from 'interfaces'

// const validateTxHash = (txHash: string): TxHash => {
//     const validTxhash = new RegExp(/^0x[a-fA-F0-9]{64}$/)
//     if (!validTxhash.test(txHash)) {
//         throw new Error(`Invalid txHash: ${txHash}`)
//     }
//     return txHash as TxHash
// }

const validateAddress = (address: string): Address => {
    const validAddress = new RegExp(/^0x[a-fA-F0-9]{40}$/)
    if (!validAddress.test(address)) {
        throw new Error(`Invalid address: ${address}`)
    }
    return address as Address
}

// lowercase addresses b/c addresses have uppercase for the checksum, but aren't when they're in a topic
function validateAndFormatTxData(txData: unvalidatedTransactionResponse): TxResponse
function validateAndFormatTxData(txData: unvalidatedTransactionReceipt): TxReceipt
function validateAndFormatTxData(
    txData: unvalidatedTransactionResponse | unvalidatedTransactionReceipt,
): TxResponse | TxReceipt {
    const txResponseFormatted = {} as any

    const addressKeys = ['from', 'to']

    for (const [key, val] of Object.entries(txData)) {
        if (addressKeys.includes(key)) {
            const address = val.toLowerCase()
            const validatedAddress = validateAddress(address)
            txResponseFormatted[key] = validatedAddress
        } else {
            txResponseFormatted[key] = val
        }
    }

    return txResponseFormatted
}

export class RawDataFetcher {
    provider: BaseProvider
    formatter = new Formatter()

    constructor(provider: BaseProvider) {
        this.provider = provider
    }

    async getTxResponse(txHash: string): Promise<TxResponse> {
        const txData = this.formatter.transactionResponse(await this.provider.getTransaction(txHash))
        const validatedAndFormattedTxResponse = validateAndFormatTxData(txData)

        console.log('validatedAndFormattedTxResponse', validatedAndFormattedTxResponse)
        return validatedAndFormattedTxResponse
    }

    async getTxReciept(txHash: string): Promise<TxReceipt> {
        const txReceipt = await this.provider.getTransactionReceipt(txHash)
        const validatedAndFormattedTxReceipt = validateAndFormatTxData(txReceipt)

        console.log('validatedAndFormattedTxReceipt', validatedAndFormattedTxReceipt)
        return validatedAndFormattedTxReceipt
    }

    // could be parallelized, but each has a different dependency graph
    async getTxData(txHash: string): Promise<RawTxData> {
        const txResponse = await this.getTxResponse(txHash)
        const txReceipt = await this.getTxReciept(txHash)

        return {
            txResponse: txResponse,
            txReceipt: txReceipt,
        }
    }
}
