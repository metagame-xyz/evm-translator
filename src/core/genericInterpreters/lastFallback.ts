import { DecodedTx } from 'interfaces/decoded'
import { Action, Interpretation } from 'interfaces/interpreted'

import { getStablecoinOrNativeWrappedAddressesBySymbol } from 'utils'

function sentBaseToken(interpretation: Interpretation): boolean {
    const currency = getStablecoinOrNativeWrappedAddressesBySymbol(interpretation.chainSymbol)
    return !!interpretation.assetsSent.find((token) => currency.includes(token.address))
}

function receivedBaseToken(interpretation: Interpretation): boolean {
    const currency = getStablecoinOrNativeWrappedAddressesBySymbol(interpretation.chainSymbol)
    return !!interpretation.assetsReceived.find((token) => currency.includes(token.address))
}

function sentOtherToken(interpretation: Interpretation): boolean {
    return interpretation.assetsSent.length > 0 && !sentBaseToken(interpretation)
}

function receivedOtherToken(interpretation: Interpretation): boolean {
    return interpretation.assetsReceived.length > 0 && !receivedBaseToken(interpretation)
}

function isAirdrop(interpretation: Interpretation, userAddress: string, fromAddress: string): boolean {
    if (interpretation.assetsReceived.length > 0 && userAddress !== fromAddress) {
        return true
    } else {
        return false
    }
}

function isClaimed(interpretation: Interpretation, userAddress: string, fromAddress: string): boolean {
    return (
        isReceived(interpretation) &&
        userAddress === fromAddress &&
        !sentBaseToken(interpretation) &&
        !sentOtherToken(interpretation)
    )
}

function isReceived(interpretation: Interpretation): boolean {
    return (
        (receivedBaseToken(interpretation) || receivedOtherToken(interpretation)) &&
        !sentBaseToken(interpretation) &&
        !sentOtherToken(interpretation)
    )
}

function isSent(interpretation: Interpretation): boolean {
    return (
        (sentBaseToken(interpretation) || sentOtherToken(interpretation)) &&
        !receivedBaseToken(interpretation) &&
        !receivedOtherToken(interpretation)
    )
}

function isBought(interpretation: Interpretation): boolean {
    // TODO: sent usdc received eth/weth
    return sentBaseToken(interpretation) && receivedOtherToken(interpretation)
}

function isSold(interpretation: Interpretation): boolean {
    // TODO sent ETH/weth received usdc/usdt/dai
    return sentOtherToken(interpretation) && receivedBaseToken(interpretation)
}

function isTraded(interpretation: Interpretation): boolean {
    return sentOtherToken(interpretation) && receivedOtherToken(interpretation)
}

function isSwapped(interpretation: Interpretation): boolean {
    // not true for eth/weth <--> usdc/usdt/dai, only true between themselves
    return sentBaseToken(interpretation) && receivedBaseToken(interpretation)
}

function getAction(interpretation: Interpretation, userAddress: string, fromAddress: string): Action {
    // Order matters here, some are sub/super sets of others

    // const isSentBaseToken = sentBaseToken(interpretation)
    // const isSentOtherToken = sentOtherToken(interpretation)
    // const isReceivedBaseToken = receivedBaseToken(interpretation)
    // const isReceivedOtherToken = receivedOtherToken(interpretation)

    // console.log('isSentBaseToken', isSentBaseToken)
    // console.log('isSentOtherToken', isSentOtherToken)
    // console.log('isReceivedBaseToken', isReceivedBaseToken)
    // console.log('isReceivedOtherToken', isReceivedOtherToken)

    if (isAirdrop(interpretation, userAddress, fromAddress)) {
        return Action.gotAirdropped
    } else if (isClaimed(interpretation, userAddress, fromAddress)) {
        return Action.claimed
    } else if (isReceived(interpretation)) {
        return Action.received
    } else if (isSent(interpretation)) {
        return Action.sent
    } else if (isBought(interpretation)) {
        return Action.bought
    } else if (isSold(interpretation)) {
        return Action.sold
    } else if (isTraded(interpretation)) {
        return Action.traded
    } else if (isSwapped(interpretation)) {
        return Action.swapped
    }
    return Action.______TODO______
}

function lastFallback(decodedData: DecodedTx, interpretation: Interpretation) {
    const { fromAddress, toAddress } = decodedData
    const { chainSymbol, userAddress, assetsReceived: tokensReceived, assetsSent: tokensSent } = interpretation

    interpretation.actions.push(getAction(interpretation, userAddress, fromAddress))

    const valueSent = tokensSent[0]?.amount || `#${tokensSent[0]?.tokenId}`
    const symbolSent = tokensSent[0]?.symbol || chainSymbol

    const valueReceived = tokensReceived[0]?.amount || `#${tokensReceived[0]?.tokenId}`
    const symbolReceived = tokensReceived[0]?.symbol || chainSymbol

    const action = interpretation.actions[0]
    if (interpretation.actions.length && action === Action.gotAirdropped) {
        interpretation.counterpartyName = fromAddress
        interpretation.exampleDescription = `${interpretation.userName} ${interpretation.actions} ${interpretation.assetsReceived[0].symbol} from ${interpretation.counterpartyName}`
    } else if (
        interpretation.actions.length &&
        (action === Action.received || action === Action.bought || action === Action.claimed)
    ) {
        interpretation.counterpartyName = toAddress
        interpretation.exampleDescription = `${interpretation.userName} ${interpretation.actions} ${valueReceived} ${symbolReceived} from ${interpretation.counterpartyName}`
    } else if (interpretation.actions.length && (action === Action.sold || action === Action.sent)) {
        interpretation.counterpartyName = toAddress
        interpretation.exampleDescription = `${interpretation.userName} ${interpretation.actions} ${valueSent} ${symbolSent} to ${interpretation.counterpartyName}`
    } else if (interpretation.actions.length && action === Action.traded) {
        interpretation.counterpartyName = toAddress
        interpretation.exampleDescription = `${interpretation.userName} ${interpretation.actions} ${valueSent} ${symbolSent} for ${valueReceived} ${symbolReceived} with ${interpretation.counterpartyName}`
    }
}

export default lastFallback
