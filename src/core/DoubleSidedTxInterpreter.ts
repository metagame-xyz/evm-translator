import { Action, Interpretation } from 'interfaces/interpreted'

export function getActionFromInterpretation(interpretation: Interpretation): Action {
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

export function getNativeValueTransferredFromInterpretation(interpretation: Interpretation): string {
    if (
        interpretation.action[0] == 'bought' &&
        parseFloat(interpretation.nativeValueReceived) === 0 &&
        parseFloat(interpretation.nativeValueSent) !== 0
    ) {
        return interpretation.nativeValueSent
    } else if (
        interpretation.action[0] == 'sold' &&
        parseFloat(interpretation.nativeValueSent) === 0 &&
        parseFloat(interpretation.nativeValueReceived) !== 0
    ) {
        return interpretation.nativeValueReceived
    } else {
        throw new Error(
            `Invalid NFT sale: action: ${interpretation.action[0]}, received ${interpretation.nativeValueReceived} ETH and ${interpretation.tokensReceived.length} tokens, sent ${interpretation.nativeValueSent} ETH and ${interpretation.tokensSent.length} tokens`,
        )
    }
}
