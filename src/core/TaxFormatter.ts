import { DecodedTx } from 'interfaces/decoded'
import { Action, ActivityData, AssetType, Interpretation } from 'interfaces/interpreted'
import { Chain } from 'interfaces/utils'
import { ZenLedgerRowType as RowType, ZenLedgerData, ZenLedgerRow } from 'interfaces/zenLedger'

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

    format(activityData: ZenLedgerData[], walletAddress = null, walletName = '') {
        this.walletAddress = walletAddress ? walletAddress : this.walletAddress
        this.walletName = walletName ? walletName : this.walletName

        activityData = activityData.filter(({ interpretedData }) => interpretedData && !interpretedData.reverted)

        for (const activity of activityData) {
            // console.log('formatting activity', activity)
            this.formatSingleActivity(activity.decodedTx, activity.interpretedData)
        }

        return this.rows
    }

    formatSingleActivity(decodedTx: DecodedTx, interpretedData: Interpretation) {
        const {
            txHash,
            contractName,
            contractAddress,
            assetsReceived,
            assetsSent,
            chainSymbol,
            reverted,
            gasPaid,
            timestamp,
            userAddress,
        } = interpretedData

        const getType = (data: Interpretation): RowType | null => {
            let rowType = null

            const action = data.actions[0]

            const isNative =
                data.assetsReceived.find((asset) => asset.type === AssetType.native) ||
                data.assetsSent.find((asset) => asset.type === AssetType.native)

            switch (action) {
                case Action.received:
                case Action.claimed:
                    rowType = RowType.receive
                    break
                case Action.sent:
                    rowType = RowType.send
                    break
                case Action.minted:
                    rowType = RowType.buy
                    break
                case Action.swapped:
                    rowType = RowType.trade
                    break
                case Action.bought:
                    rowType = isNative ? RowType.trade : RowType.buy
                    break
                case Action.sold:
                    rowType = isNative ? RowType.trade : RowType.sell
                    break
                case Action.gotAirdropped:
                    rowType = RowType.airdrop
                    break
                case Action.revoked:
                case Action.approved:
                case Action.transferredOwnership:
                case Action.receivedOwnership:
                case Action.deployed:
                case Action.executed:
                case Action.canceled:
                    rowType = RowType.fee
                    break
                default:
                    rowType = RowType.unknown
                    break
            }

            return rowType
        }

        // type TokenTypeOrNative = AssetType | 'native' | null

        const getAmountAndCurrency = (
            data: Interpretation,
            direction: 'in' | 'out',
        ): [number | null, string | null, AssetType] => {
            const assets = direction === 'in' ? data.assetsReceived : data.assetsSent
            const opposite = direction === 'in' ? data.assetsSent : data.assetsReceived
            let amount = null
            let currency = null
            let type = AssetType.DEFAULT

            if (assets.length > 0) {
                type = assets[0].type

                if (type === AssetType.ERC20 || type === AssetType.native) {
                    amount = Number(assets[0].amount)
                    currency = assets[0].symbol
                } else if (type === AssetType.ERC721) {
                    amount = 1
                    currency = assets[0].symbol + '-' + assets[0].tokenId?.toString().slice(0, 6)
                } else if (type === AssetType.ERC1155) {
                    amount = Number(assets[0].amount)
                    currency = assets[0].symbol + '-' + assets[0].tokenId?.toString().slice(0, 6)
                } else if (type === AssetType.LPToken) {
                    amount = Number(assets[0].amount)
                    currency = opposite[0].symbol + '-' + opposite[1].symbol
                }
            }
            return [amount, currency, type]
        }

        const userInitiated = this.walletAddress === userAddress

        const [receivedAmount, receivedSymbol, receivedType] = getAmountAndCurrency(interpretedData, 'in')
        const [sentAmount, sentSymbol, sentType] = getAmountAndCurrency(interpretedData, 'out')

        const dateTime = new Date((timestamp || 0) * 1000)

        const row: ZenLedgerRow = {
            explorerUrl: this.chain.blockExplorerUrl + 'tx/' + txHash,
            userInitiated: userInitiated ? 'true' : 'false',
            Type: getType(interpretedData),
            method: decodedTx.methodCall.name || 'UNKNOWN',
            contract: contractName || 'UNKNOWN',
            'In Amount': receivedAmount,
            'In Currency': receivedSymbol,
            'Out Amount': sentAmount,
            'Out Currency': sentSymbol,
            Timestamp: dateTime.toJSON(),

            'Fee Amount': userInitiated ? Number(gasPaid) : 0,
            'Fee Currency': chainSymbol || 'UNKNOWN',
            'Exchange(optional)': 'Unified ETH Wallet',
            'US Based': 'Yes',

            txHash,
            action: interpretedData.actions[0],

            'received type': receivedType,
            'received amount': receivedAmount,
            'received symbol': receivedSymbol,

            'received type 2': assetsReceived[1] ? assetsReceived[1].type : null,
            'received amount 2': assetsReceived[1] ? Number(assetsReceived[1].amount) : null,
            'received symbol 2': assetsReceived[1] ? assetsReceived[1].symbol : null,

            'sent type': sentType,
            'sent amount': sentAmount,
            'sent symbol': sentSymbol,

            'sent type 2': assetsSent[1] ? assetsSent[1].type : null,
            'sent amount 2': assetsSent[1] ? Number(assetsSent[1].amount) : null,
            'sent symbol 2': assetsSent[1] ? assetsSent[1].symbol : null,
            toAddress: contractAddress,
            // network: interpretedData.chainSymbol || 'UNKNOWN',
            // walletAddress: this.walletAddress,
            // walletName: this.walletName,
        }

        this.rows.push(row)
    }
}

export default TaxFormatter
