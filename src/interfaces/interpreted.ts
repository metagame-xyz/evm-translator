// Generally objective additional info (data hardcoded by humans)
import { DecodedTx } from './decoded'
import { RawTxData } from './rawData'
import { ChainSymbol } from './utils'

/**
 * Each address that was part of a transaction has its own interpretation of the transaction.
 * native tokens and gas number are denominated in their native token (ex: eth, not wei)
 */
export type Interpretation = {
    txHash: string
    userAddress: string
    contractName: string | null
    contractAddress: string | null
    actions: Action[]
    fromName?: string
    toName?: string
    exampleDescription: string
    assetsSent: Asset[] // usually just one token
    assetsReceived: Asset[] // usually just one token
    chainSymbol: ChainSymbol
    userName: string
    counterpartyName: string | null // the opposite side of the tx, opposite of userName
    extra: Record<string, any>
    /* null when false so we can hide the null columns more easily */
    reverted: true | null
    gasPaid: string
    timestamp: number | null
}

export type ActivityData = {
    rawTxData: RawTxData
    decodedTx: DecodedTx
    interpretedData: Interpretation
}

export const enum Action {
    unknown = 'unknown',
    received = 'received',
    sent = 'sent',
    minted = 'minted',
    burned = 'burned',
    transferred = 'transferred',
    deployed = 'deployed',
    executed = 'executed',
    bought = 'bought',
    sold = 'sold',
    /** Trading one non-native, non-stablecoin token for another */
    traded = 'traded',
    /** Trading one stablecoin for another, or native token for the wrapped version (but not actually wrapping it using the wrapping contract itself) */
    swapped = 'swapped',
    canceled = 'canceled',
    transferredOwnership = 'transferred ownership',
    receivedOwnership = 'received ownership',
    addedLiquidity = 'added liquidity',
    removedLiquidity = 'removed liquidity',
    claimed = 'claimed',
    contributed = 'contributed',
    redeemed = 'redeemed',
    approved = 'approved',
    revoked = 'revoked',
    gotAirdropped = 'got airdropped',
    collected = 'collected',
    multicall = 'executed multiple actions',
    __NFTSALE__ = '__NFTSALE__',
    ______TODO______ = '______TODO______',
}

export const enum AssetType {
    ERC20 = 'ERC20',
    ERC721 = 'ERC721',
    ERC1155 = 'ERC1155',
    LPToken = 'LPToken',
    DEFAULT = 'unknown',
    native = 'native',
}
export type Asset = {
    type: AssetType
    name: string | null
    symbol: string | null
    address: string
    amount?: string
    token0?: Asset
    token1?: Asset
    pair?: string // "RARE-WETH"
    tokenId?: string
}
