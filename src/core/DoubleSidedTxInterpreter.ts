import { Action, AssetType, Interpretation } from 'interfaces/interpreted'

export function getActionForDoubleSidedTx(interpretation: Interpretation): Action {
    const nativeValueSent = interpretation.assetsSent.find((asset) => asset.type === AssetType.native)?.amount || '0'
    const nativeValueReceived =
        interpretation.assetsReceived.find((asset) => asset.type === AssetType.native)?.amount || '0'

    if (parseFloat(nativeValueSent) !== 0 && interpretation.assetsReceived.length) {
        return Action.bought
    } else if (parseFloat(nativeValueReceived) !== 0 && interpretation.assetsSent.length) {
        return Action.sold
    } else {
        console.log(
            `ERROR! Invalid NFT sale: received ${nativeValueReceived} ETH and ${interpretation.assetsReceived.length} tokens, sent ${nativeValueSent} ETH and ${interpretation.assetsSent.length} tokens`,
        )
        return Action.unknown
    }
}

export function getNativeValueTransferredForDoubleSidedTx(interpretation: Interpretation): string {
    const nativeValueSent = interpretation.assetsSent.find((asset) => asset.type === AssetType.native)?.amount || '0'
    const nativeValueReceived =
        interpretation.assetsReceived.find((asset) => asset.type === AssetType.native)?.amount || '0'

    if (
        interpretation.actions[0] == 'bought' &&
        parseFloat(nativeValueReceived) === 0 &&
        parseFloat(nativeValueSent) !== 0
    ) {
        return nativeValueSent
    } else if (
        interpretation.actions[0] == 'sold' &&
        parseFloat(nativeValueSent) === 0 &&
        parseFloat(nativeValueReceived) !== 0
    ) {
        return nativeValueReceived
    } else {
        console.log(
            `Invalid NFT sale: action: ${interpretation.actions[0]}, received ${nativeValueReceived} ETH and ${interpretation.assetsReceived.length} tokens, sent ${nativeValueSent} ETH and ${interpretation.assetsSent.length} tokens`,
        )
        return Action.unknown
    }
}
