/* eslint-disable no-debugger */
import {
    TransactionReceipt as unvalidatedTransactionReceipt,
    TransactionResponse as unvalidatedTransactionResponse,
} from '@ethersproject/abstract-provider'
import { AlchemyProvider, Formatter } from '@ethersproject/providers'
import { BigNumber } from 'ethers'
import {
    Address,
    RawTxData,
    RawTxDataWithoutTrace,
    TraceLog,
    TxReceipt,
    TxResponse,
    UnvalidatedTraceLog,
} from 'interfaces'
import { CovalentTxData } from 'interfaces/covalent'
import { EVMTransaction, EVMTransactionReceiptStringified, EVMTransactionStringified } from 'interfaces/s3'
import { validateAddress, validateAndNormalizeAddress } from 'utils'
import Covalent from 'utils/clients/Covalent'

export default class RawDataFetcher {
    provider: AlchemyProvider
    covalent: Covalent | null
    formatter = new Formatter()

    constructor(provider: AlchemyProvider, covalent: Covalent | null = null) {
        this.provider = provider
        this.covalent = covalent
    }

    async getTxTrace(txHash: string): Promise<TraceLog[]> {
        console.log('in trace')
        const unvalidatedTrace = (await this.provider.send('trace_transaction', [txHash])) as UnvalidatedTraceLog[]
        const traceLogs = validateTraceTxData(unvalidatedTrace)
        console.log('tried tracing')
        console.log('trace logs', traceLogs)

        return traceLogs
    }

    async getTxResponse(txHash: string): Promise<TxResponse> {
        const unformatted = await this.provider.getTransaction(txHash)
        // console.log('unformatted:', unformatted)
        const txData = this.formatter.transactionResponse(unformatted)
        const validatedAndFormattedTxResponse = validateAndFormatTxData(txData)
        return validatedAndFormattedTxResponse
    }

    async getTxReceipt(txHash: string): Promise<TxReceipt> {
        const txReceipt = await this.provider.getTransactionReceipt(txHash)
        // console.log('txReceipt:', txReceipt)
        const validatedAndFormattedTxReceipt = validateAndFormatTxData(txReceipt)
        return validatedAndFormattedTxReceipt
    }

    // could be parallelized, but each has a different dependency graph
    async getTxData(txHash: string): Promise<RawTxData> {
        let txResponse: TxResponse
        let txReceipt: TxReceipt
        let txTrace: TraceLog[]

        try {
            ;[txResponse, txReceipt, txTrace] = await Promise.all([
                this.getTxResponse(txHash),
                this.getTxReceipt(txHash),
                this.getTxTrace(txHash),
            ])
        } catch (e) {
            console.error('error in getTxData', e)
            throw e
        }

        return {
            txResponse,
            txReceipt,
            txTrace,
        }
    }

    getTxDataFromS3Tx(tx: EVMTransaction, timestamp: number): RawTxData {
        const txDataStringified = numbersToStrings(tx)
        const txReceipt = validateAndFormatTxData(txDataStringified.transactionReceipt, timestamp)
        const txTrace = validateTraceTxData(txDataStringified.trace)
        const formattedTxResponse = this.formatter.transactionResponse(txDataStringified)
        const txResponse = validateAndFormatTxData(formattedTxResponse)

        return {
            txResponse,
            txReceipt,
            txTrace,
        }
    }

    // TODO should we get the timestamp somehow here too?
    async getTxDataWithoutTrace(txHash: string): Promise<RawTxDataWithoutTrace> {
        let txResponse: TxResponse
        let txReceipt: TxReceipt

        try {
            ;[txResponse, txReceipt] = await Promise.all([this.getTxResponse(txHash), this.getTxReceipt(txHash)])
        } catch (e) {
            console.error('error in getTxData', e)
            throw e
        }

        return {
            txResponse,
            txReceipt,
        }
    }

    async getTxDataWithCovalentByAddress(
        address: Address,
        includedInitiatedTxs: boolean,
        includedNotInitiatedTxs: boolean,
        limit: number,
    ): Promise<{ rawTxDataArr: RawTxData[]; covalentTxDataArr: CovalentTxData[] }> {
        if (!this.covalent) {
            throw new Error('no covalent client')
        }
        const allCovalentTxDataArr = await this.covalent.getTransactionsFor(address, limit)

        const covalentTxDataArr = allCovalentTxDataArr.filter((tx) => {
            if (includedInitiatedTxs && includedNotInitiatedTxs) {
                return true
            } else if (includedInitiatedTxs) {
                return tx.from_address === address // only transactions initiated by the user, no scam airdrops
            } else if (includedNotInitiatedTxs) {
                return tx.from_address !== address // only transactions not initiated by the user, just airdrops
            } else {
                return false
            }
        })

        const rawTxDataArr = await Promise.all(
            covalentTxDataArr.map(async (tx) => {
                return await this.getTxData(tx.tx_hash)
            }),
        )

        return {
            rawTxDataArr,
            covalentTxDataArr,
        }
    }

    static getContractAddressesFromRawTxData(rawTxData: RawTxData | RawTxDataWithoutTrace): Address[] {
        const { txReceipt } = rawTxData
        const addresses: Address[] = []
        addresses.push(validateAndNormalizeAddress(txReceipt.to))

        txReceipt.logs.forEach(({ address }) => {
            addresses.push(validateAndNormalizeAddress(address))
        })

        return [...new Set(addresses)]
    }
}

// const validateTxHash = (txHash: string): TxHash => {
//     const validTxhash = new RegExp(/^0x[a-fA-F0-9]{64}$/)
//     if (!validTxhash.test(txHash)) {
//         throw new Error(`Invalid txHash: ${txHash}`)
//     }
//     return txHash as TxHash
// }

function numbersToStrings(txData: EVMTransaction): EVMTransactionStringified {
    const receiptWithNumbers = txData.transactionReceipt
    const receipt: EVMTransactionReceiptStringified = {
        transactionHash: receiptWithNumbers.transactionHash,
        transactionIndex: receiptWithNumbers.transactionIndex,
        blockHash: receiptWithNumbers.blockHash,
        blockNumber: receiptWithNumbers.blockNumber,
        cumulativeGasUsed: receiptWithNumbers.cumulativeGasUsed.toString(),
        gasUsed: receiptWithNumbers.gasUsed.toString(),
        contractAddress: receiptWithNumbers.contractAddress,
        logs: receiptWithNumbers.logs,
        logsBloom: receiptWithNumbers.logsBloom,
        root: receiptWithNumbers.root,
        status: receiptWithNumbers.status,
        to: txData.to,
        from: txData.from,
    }

    const txDataStringified: EVMTransactionStringified = {
        hash: txData.hash,
        nonce: txData.nonce,
        blockHash: txData.blockHash,
        blockNumber: txData.blockNumber,
        transactionIndex: txData.transactionIndex,
        from: txData.from,
        to: txData.to,
        value: txData.value.toString(),
        gas: txData.gas.toString(),
        gasPrice: txData.gasPrice.toString(),
        input: txData.input,
        transactionReceipt: receipt,
        trace: txData.trace,
    }

    return txDataStringified
}

// lowercase addresses b/c addresses have uppercase for the checksum, but aren't when they're in a topic
function validateAndFormatTxData(txData: unvalidatedTransactionResponse): TxResponse
function validateAndFormatTxData(txData: unvalidatedTransactionReceipt): TxReceipt
function validateAndFormatTxData(txData: EVMTransactionReceiptStringified, timestamp: number | null): TxReceipt
function validateAndFormatTxData(txData: EVMTransactionStringified): TxResponse
function validateAndFormatTxData(
    txData:
        | unvalidatedTransactionResponse
        | unvalidatedTransactionReceipt
        | EVMTransactionStringified
        | EVMTransactionReceiptStringified,
    timestamp: number | null = null,
): TxResponse | TxReceipt {
    const txResponseFormatted = {} as any

    const addressKeys = ['from', 'to']

    for (const [key, val] of Object.entries(txData)) {
        if (addressKeys.includes(key) && val) {
            const address = val.toLowerCase()
            const validatedAddress = validateAddress(address)
            txResponseFormatted[key] = validatedAddress
            // in EVMTransaction
        } else if (typeof val === 'number') {
            txResponseFormatted[key] = val.toString()
        } else if (key !== 'transactionReceipt' && key !== 'trace') {
            txResponseFormatted[key] = val
        }
    }

    if (timestamp) {
        txResponseFormatted.timestamp = timestamp
    }

    return txResponseFormatted
}

function validateTraceTxData(traceLogsArr: UnvalidatedTraceLog[]): TraceLog[] {
    const traceLogsFormatted = [] as TraceLog[]

    for (const tl of traceLogsArr) {
        const { action: a, result: r } = tl

        //skips contract creation, for now. There's no internal transactions, but this makes the data incomplete
        if (a.to) {
            const traceLogFormatted = {
                ...tl,
                action: {
                    callType: a.callType,
                    from: validateAddress(a.from),
                    to: validateAddress(a.to),
                    gas: BigNumber.from(a.gas),
                    value: BigNumber.from(a.value),
                    input: a.input,
                },
                result: {
                    gasUsed: BigNumber.from(r.gasUsed),
                    output: r.output,
                },
            } as TraceLog

            traceLogsFormatted.push(traceLogFormatted)
        }
    }

    return traceLogsFormatted
}

// function covalentToRawTxData(rawCovalentData: CovalentTxData): TxReceipt {
//     const data = rawCovalentData
//     const txReceipt: TxReceipt = {
//         transactionHash: data.tx_hash,
//         transactionIndex: data.tx_offset,
//         to: data.to_address,
//         from: data.from_address,
//         blockNumber: data.block_height,
//         gasUsed: BigNumber.from(data.gas_spent),
//         effectiveGasPrice: BigNumber.from(data.gas_price),
//         status: data.successful ? 1 : 0,
//         logs: data.log_events.map((log) => ({
//             blockNumber: log.block_height,
//             transactionIndex: data.tx_offset,
//             // blockHash: data. ,
//             // removed: log. ,
//             address: log.sender_address,
//             data: log.raw_log_data,
//             topics: log.raw_log_topics,
//             transactionHash: log.tx_hash,
//             logIndex: log.log_offset,
//         })),

//         // KEEP but Covalent does not have this
//         // contractAddress: string,
//         // blockHash: string,
//         // confirmations: number,

//         // REMOVE, I dont think we need any of these
//         // logsBloom: string,
//         // root?: string,
//         // cumulativeGasUsed: BigNumber,
//         // byzantium: boolean,
//         // type: number;
//     }

//     return txReceipt
// }
