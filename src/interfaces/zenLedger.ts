import { RawTxData } from './rawData'

import { DecodedTx } from 'interfaces/decoded'
import { AssetType, Interpretation } from 'interfaces/interpreted'

export type ZenLedgerRow = {
    // ZenLedger required Columns
    Timestamp: number
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
    // walletAddress: string
    // walletName: string
    explorerUrl: string
    userInitiated: 'true' | 'false'
    method: string
    contract: string
    inType: AssetType | 'native' | null
    outType: AssetType | 'native' | null
    lpRelated: 'true' | 'false'
    toAddress: string | null
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

export type ActivityDataWthZenLedger = {
    rawTxData: RawTxData
    decodedData: DecodedTx
    interpretedData: Interpretation
    taxData?: ZenLedgerRow
}
