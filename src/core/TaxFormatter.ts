import { DecodedTx } from 'interfaces/decoded'
import { ActivityData, AssetType, Interpretation } from 'interfaces/interpreted'
import { Chain } from 'interfaces/utils'
import { ZenLedgerRowType as RowType, ZenLedgerRow } from 'interfaces/zenLedger'

import { chains } from 'utils'

class TaxFormatter {
    walletAddress: string
    walletName: string
    chain: Chain
    rows: ZenLedgerRow[] = []

    constructor(walletAddress: string, walletName: string, chain: Chain = chains.ethereum) {
        this.walletAddress = walletAddress
        this.walletName = walletName
        this.chain = chain
    }

    format(activityData: ActivityData[], walletAddress = null, walletName = '') {
        this.walletAddress = walletAddress ? walletAddress : this.walletAddress
        this.walletName = walletName ? walletName : this.walletName

        for (const activity of activityData) {
            // console.log('formatting activity', activity)
            this.formatSingleActivity(activity)
        }

        return this.rows
    }

    formatSingleActivity(activity: ActivityData) {
        const { rawTxData, decodedTx: decodedData, interpretedData } = activity

        const getType = (data: Interpretation, decodedData: DecodedTx): RowType | null => {
            let rowType = null

            // console.log('method:', decodedData.methodCall.name, 'tokens received', interpretedData.tokensReceived)

            const receivedSomething = data.assetsReceived.length > 0 // dont know how to get if you received eth
            const receivedNothing = data.assetsReceived.length === 0 // dont know how to get if you received eth
            const sentSomething = data.assetsSent.length > 0
            const sentNothing = data.assetsSent.length === 0

            if (receivedNothing && sentNothing) {
                rowType = RowType.fee
            } else if (decodedData.methodCall.name === 'mint') {
                rowType = RowType.nft_mint
            } else if (receivedSomething && data.assetsSent[0]?.symbol === 'USDC') {
                rowType = RowType.buy
            } else if (sentSomething && data.assetsReceived[0]?.symbol === 'USDC') {
                rowType = RowType.sell
            } else if (sentSomething && receivedSomething) {
                rowType = RowType.trade
            } else if (sentSomething && receivedNothing) {
                // rowType = RowType.
                rowType = null
            } else if (receivedSomething && sentNothing) {
                rowType = RowType.staking_reward
            }

            return rowType
        }

        type TokenTypeOrNative = AssetType | 'native' | null

        const getAmountAndCurrency = (
            data: Interpretation,
            direction: 'in' | 'out',
            userInitiated: boolean,
        ): [number | null, string | null, TokenTypeOrNative] => {
            if (data.reverted) return [null, null, null]

            let amount = null
            let currency = null
            let type: TokenTypeOrNative = null

            const tokens = direction === 'in' ? data.assetsReceived : data.assetsSent

            if (tokens.length > 0) {
                type = tokens[0].type

                if (type === AssetType.ERC20 || type === AssetType.native) {
                    amount = Number(tokens[0].amount)
                    currency = tokens[0].symbol
                } else if (type === AssetType.ERC721) {
                    amount = 1
                    currency = tokens[0].symbol + '-' + tokens[0].tokenId?.toString().slice(0, 6)
                } else if (type === AssetType.LPToken) {
                    amount = Number(tokens[0].amount)
                    currency =
                        tokens[0].symbol +
                        ' ' +
                        (data.extra?.token_0 ?? 'UNKNOWN') +
                        '-' +
                        (data.extra?.token_1 ?? 'UNKNOWN')
                }
                // TODO 1155
            }
            return [amount, currency, type]
        }

        const userInitiated = this.walletAddress === rawTxData.txResponse.from

        const [inAmount, inCurrency, inType] = getAmountAndCurrency(interpretedData, 'in', userInitiated)
        const [outAmount, outCurrency, outType] = getAmountAndCurrency(interpretedData, 'out', userInitiated)

        const row: ZenLedgerRow = {
            explorerUrl: this.chain.blockExplorerUrl + 'tx/' + rawTxData.txReceipt.transactionHash,
            userInitiated: userInitiated ? 'true' : 'false',
            Type: getType(interpretedData, decodedData),
            inType: inType,
            outType: outType,
            method: decodedData.methodCall.name || 'UNKNOWN',
            contract: interpretedData.contractName || 'UNKNOWN',
            'In Amount': inAmount,
            'In Currency': inCurrency,
            'Out Amount': outAmount,
            'Out Currency': outCurrency,
            Timestamp: decodedData.timestamp || 0,
            'Fee Amount': userInitiated ? Number(interpretedData.gasPaid) : 0,
            'Fee Currency': interpretedData.chainSymbol || 'UNKNOWN',
            'Exchange (optional)': 'Metamask',
            'US Based': 'yes',
            txHash: rawTxData.txReceipt.transactionHash,
            // network: interpretedData.chainSymbol || 'UNKNOWN',
            // walletAddress: this.walletAddress,
            // walletName: this.walletName,
            // Todo this doesn't take into account when one of them is ETH
            lpRelated:
                interpretedData.assetsReceived.length > 1 || interpretedData.assetsSent.length > 1 ? 'true' : 'false',
            // reviewed: null,
            toAddress: decodedData.toAddress || null,
        }

        this.rows.push(row)
    }
}

export default TaxFormatter
