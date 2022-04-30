export enum TX_TYPE {
    TRANSFER = 'native token transfer',
    CONTRACT_DEPLOY = 'contract deploy',
    CONTRACT_INTERACTION = 'contract interaction',
}

export type Address = `0x${string}`

export type Decoded = {
    /** The transaction's unique hash */
    txHash: string
    txType?: TX_TYPE /** Transfer, Contract Deploy, or Contract Interaction */
    // contractType: ContractType
    contractMethod?: string | null
    contractName?: string
    officialContractName?: string | null
    fromENS?: string | null
    toENS?: string | null
    // interactions: Array<Interaction>
    nativeTokenValueSent?: string
    nativeTokenValueReceived?: string // so hard to get this
    nativeTokenSymbol: string
    txIndex?: number
    fromAddress: Address
    toAddress?: Address
    reverted?: boolean
    timestamp?: string //
    gasUsed?: string
    effectiveGasPrice?: string
}
