import { Action, Interpretation } from 'interfaces/interpreted'

export function getActionFromInterpretation(interpretation: Interpretation): Action {
  if (interpretation.nativeValueSent !== '0' && interpretation.tokensReceived.length) {
    return Action.bought
  } else if (interpretation.nativeValueReceived !== '0' && interpretation.tokensSent.length) {
    return Action.sold
  } else {
    throw new Error(`Invalid NFT sale: received ${interpretation.nativeValueReceived} ETH and ${interpretation.tokensReceived.length} tokens, sent ${interpretation.nativeValueSent} ETH and ${interpretation.tokensSent.length} tokens`)
  }
}

export function getNativeValueTransferredFromInterpretation(interpretation: Interpretation): string {
  if (interpretation.action == 'bought' && interpretation.nativeValueReceived === '0' && interpretation.nativeValueSent !== '0') {
    return interpretation.nativeValueSent
  } else if (interpretation.action == 'sold' && interpretation.nativeValueSent === '0' && interpretation.nativeValueReceived !== '0') {
    return interpretation.nativeValueReceived
  } else {
    throw new Error(`Invalid NFT sale: received ${interpretation.nativeValueReceived} ETH and ${interpretation.tokensReceived.length} tokens, sent ${interpretation.nativeValueSent} ETH and ${interpretation.tokensSent.length} tokens`)
  }
}