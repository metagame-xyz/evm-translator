import {
    TransactionReceipt as unvalidatedTransactionReceipt,
    TransactionResponse as unvalidatedTransactionResponse,
} from '@ethersproject/providers'

/* eslint-disable no-unused-vars */
export type Address = `0x${string}`
export type TxHash = `0x${string}`
export type Chain = {
    EVM: boolean
    id: number
    name: string
    symbol: string
    testnet: boolean
    blockExplorerUrl: string
}

export type Chains = Record<string, Chain>

export enum TX_TYPE {
    TRANSFER = 'native token transfer',
    CONTRACT_DEPLOY = 'contract deploy',
    CONTRACT_INTERACTION = 'contract interaction',
}

export type TxResponse = Omit<unvalidatedTransactionResponse, 'from' | 'to'> & { from: Address; creates: string }
export type TxReceipt = Omit<unvalidatedTransactionReceipt, 'from' | 'to'> & { from: Address; to: Address }

export type RawTxData = {
    txResponse: TxResponse
    txReceipt: TxReceipt
}

export type InProgressActivity = {
    rawTxData?: RawTxData
    decoded?: Decoded
}

export type RawTxDataOld = {
    txHash: string
    txIndex: number
    to: Address
    from: Address
    block: number
    value: string
    timestamp: Date
    gas_units: number
    gas_price: number
    successful: boolean
    input: string | null
    log_events: RawLogEvent[]
}

export type RawLogEvent = {
    address: Address
    topics: string[]
    data: string
    logIndex: number
}

//  100% objective additional info (data taken from a blockchain)
export type Decoded = {
    txType?: TX_TYPE
    contractMethod?: string | null
    contractName?: string
    officialContractName?: string | null
    fromENS?: string | null
    toENS?: string | null
    interactions: Array<Interaction>
    nativeTokenValueSent?: string
    nativeTokenValueReceived?: string // so hard to get this
    nativeTokenSymbol?: string
    txIndex?: number
    fromAddress?: Address
    toAddress?: Address
    reverted?: boolean
    timestamp?: string //
    gasUsed?: string
    effectiveGasPrice?: string
}

export type Interaction = {
    contractName: string
    contractSymbol: string
    contractAddress: string
    events: Array<InteractionEvent>
}

export type InteractionEvent = { event: string; logIndex: number; value?: string } & Record<string, unknown>

// Generally objective additional info (data hardcoded by humans)
export type Interpretation = {
    contractName?: string
    action?: Action
    exampleDescription?: string
    tokensSent: Token[] // usually just one token
    tokensReceived: Token[] // usually just one token
    nativeTokenValueSent?: string
    nativeTokenValueReceived?: string
    nativeTokenSymbol?: string
    userName: string
    extra?: Record<string, unknown>
    reverted?: boolean
    gasPaid?: string
}

export type ActivityData = {
    rawTxData: RawTxData
    decodedData: Decoded
    interpretedData: Interpretation
    taxData?: ZenLedgerRow
}

export type Action =
    | 'received'
    | 'sent'
    | 'minted'
    | 'burned'
    | 'transferred'
    | 'deployed'
    | 'executed'
    | 'bought'
    | 'sold'
    | 'swapped'
    | 'canceled'
    | 'transferred ownership'
    | 'received ownership'
    | 'added liquidity'
    | 'removed liquidity'
    | 'claimed'
    | 'contributed'
    | 'redeemed'
    | '______TODO______'

export enum TokenType {
    ERC20 = 'ERC20',
    ERC721 = 'ERC721',
    ERC1155 = 'ERC1155',
    LPToken = 'LPToken',
    DEFAULT = 'unknown',
}
export type Token = {
    type: TokenType
    name: string
    symbol: string
    address: string
    amount?: string
    token0?: Token
    token1?: Token
    pair?: string // "RARE-WETH"
    tokenId?: string
}

export type EthersAPIKeys = {
    alchemy: string
    etherscan: string
    infura: string
    pocket: {
        applicationId: string
        applicationSecretKey: string
    }
}

export type ZenLedgerRow = {
    // ZenLedger required Columns
    Timestamp: string
    Type: ZenLedgerRowType | null
    'In Amount': number | null
    'In Currency': string | null
    'Out Amount': number | null
    'Out Currency': string | null
    'Fee Amount': number
    'Fee Currency': string
    'Exchange (optional)': string | null
    'US Based': 'yes' | 'no'

    // Additional helpful columns
    txHash: string
    // network: string // 'ETH' | 'MATIC' | 'UNKNOWN'
    // walletAddress: Address
    // walletName: string
    explorerUrl: string
    userInitiated: 'true' | 'false'
    method: string
    contract: string
    inType: TokenType | 'native' | null
    outType: TokenType | 'native' | null
    lpRelated: 'true' | 'false'
    toAddress: Address | null
    // reviewed: null
}

export enum ZenLedgerRowType {
    buy = 'Buy',
    sell = 'Sell',
    trade = 'Trade',
    // receive = 'receive',
    // send = 'send',
    // Initial_Coin_Offering = 'Initial Coin Offering',
    // margin_trade = 'margin trade',
    // staking = 'staking',
    // fork = 'fork',
    airdrop = 'Airdrop',
    payment = 'Payment',
    // mined = 'Mined',
    gift_sent = 'Gift sent',
    fee = 'Fee',
    staking_reward = 'Staking reward',
    // dividend_received = 'Dividend received',
    interest_received = 'Interest received',
    misc_reward = 'Misc reward',
    // margin_gain = 'Margin gain',
    // margin_loss = 'Margin loss',
    lost = 'Lost',
    stolen = 'Stolen',
    nft_mint = 'Nft Mint',
    donation_501c3 = 'Donation 501c3',
    // staking_lockup = 'Staking Lockup',
    // staking_return = 'Staking Return',
    // nft_trade = 'Nft Trade',
    // UNKNOWN_TX_TYPE = 'UNKNOWN TX TYPE',
}
