import { Action, Interpretation } from 'interfaces/interpreted'

export function getActionForDoubleSidedTx(interpretation: Interpretation): Action {
    if (parseFloat(interpretation.nativeValueSent) !== 0 && interpretation.tokensReceived.length) {
        return Action.bought
    } else if (parseFloat(interpretation.nativeValueReceived) !== 0 && interpretation.tokensSent.length) {
        return Action.sold
    } else {
        throw new Error(
            `Invalid NFT sale: received ${interpretation.nativeValueReceived} ETH and ${interpretation.tokensReceived.length} tokens, sent ${interpretation.nativeValueSent} ETH and ${interpretation.tokensSent.length} tokens`,
        )
    }
}

export function getNativeValueTransferredForDoubleSidedTx(interpretation: Interpretation): string {
    if (
        interpretation.actions[0] == 'bought' &&
        parseFloat(interpretation.nativeValueReceived) === 0 &&
        parseFloat(interpretation.nativeValueSent) !== 0
    ) {
        return interpretation.nativeValueSent
    } else if (
        interpretation.actions[0] == 'sold' &&
        parseFloat(interpretation.nativeValueSent) === 0 &&
        parseFloat(interpretation.nativeValueReceived) !== 0
    ) {
        return interpretation.nativeValueReceived
    } else {
        throw new Error(
            `Invalid NFT sale: action: ${interpretation.actions[0]}, received ${interpretation.nativeValueReceived} ETH and ${interpretation.tokensReceived.length} tokens, sent ${interpretation.nativeValueSent} ETH and ${interpretation.tokensSent.length} tokens`,
        )
    }
}
