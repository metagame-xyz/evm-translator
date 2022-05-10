export type FullEVMBlock = {
    number: number
    hash: string
    parentHash: string
    nonce: string
    sha3Uncles: string
    logsBloom: string
    transactionsRoot: string
    stateRoot: string
    miner: string
    difficulty: number
    totalDifficulty: number
    extraData: string
    size: number
    gasLimit: number
    gasUsed: number
    timestamp: number
    uncles: string[]
    transactions: EVMTransaction[]
}

export type EVMTransaction = {
    hash: string
    nonce: number
    blockHash: string
    blockNumber: number
    transactionIndex: number
    from: string
    to: string
    value: number
    gas: number
    gasPrice: number
    input: string
    transactionReceipt: EVMTransactionReceipt
    trace: any
}

export type EVMTransactionStringified = {
    hash: string
    nonce: number
    blockHash: string
    blockNumber: number
    transactionIndex: number
    from: string
    to: string
    value: string
    gas: string
    gasPrice: string
    input: string
    transactionReceipt: EVMTransactionReceiptStringified
    trace: any
}

export type EVMTransactionReceipt = {
    transactionHash: string
    transactionIndex: number
    blockHash: string
    blockNumber: number
    cumulativeGasUsed: number
    gasUsed: number
    contractAddress: string
    logs: EVMLog[]
    logsBloom: string
    root: string
    status: string
    to?: string
    from?: string
}
export type EVMTransactionReceiptStringified = {
    transactionHash: string
    transactionIndex: number
    blockHash: string
    blockNumber: number
    cumulativeGasUsed: string
    gasUsed: string
    contractAddress: string
    logs: EVMLog[]
    logsBloom: string
    root: string
    status: string
    to?: string
    from?: string
}

export type EVMLog = {
    removed: boolean
    logIndex: number
    transactionIndex: number
    transactionHash: string
    blockNumber: number
    blockHash: string
    address: string
    data: string
    topics: string[]
}
