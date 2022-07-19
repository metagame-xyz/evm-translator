import { RawTxData } from './rawData'

import { DecodedTx } from 'interfaces/decoded'
import { Action, AssetType, Interpretation } from 'interfaces/interpreted'

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
    'Exchange(optional)': string | null
    'US Based': 'Yes' | 'No'

    // Additional helpful columns
    txHash: string
    action: Action

    'received type': AssetType | null
    'received amount': number | null
    'received symbol': string | null

    'received type 2': AssetType | null
    'received amount 2': number | null
    'received symbol 2': string | null

    'sent type': AssetType | null
    'sent amount': number | null
    'sent symbol': string | null

    'sent type 2': AssetType | null
    'sent amount 2': number | null
    'sent symbol 2': string | null
    explorerUrl: string
    userInitiated: 'true' | 'false'
    method: string
    contract: string
    // lpRelated: 'true' | 'false'
    toAddress: string | null
    // network: string // 'ETH' | 'MATIC' | 'UNKNOWN'
    // walletAddress: string
    // walletName: string
    // reviewed: null
}

export enum ZenLedgerRowType {
    buy = 'Buy',
    sell = 'Sell',
    trade = 'Trade',
    receive = 'Receive',
    send = 'Send',
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
    unknown = 'Unknown',
}

export type ZenLedgerData = {
    decodedTx: DecodedTx
    interpretedData: Interpretation
    taxData?: ZenLedgerRow
}
