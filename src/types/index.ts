export type Address = `0x${string}`
export type Chain = {
    EVM: boolean
    id: number
    name: string
    symbol: string
    testnet: boolean
    blockExplorerUrl: string
}

export type Chains = Record<string, Chain>
