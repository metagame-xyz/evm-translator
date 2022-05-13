import { Action, Address, Decoded, Interpretation } from 'interfaces'
import { getStablecoinOrNativeWrappedAddressesBySymbol } from 'utils'

function sentBaseToken(interpretation: Interpretation): boolean {
    const { chainSymbol, nativeValueSent } = interpretation
    const currency = getStablecoinOrNativeWrappedAddressesBySymbol(chainSymbol)

    return !!interpretation.tokensSent.find((token) => currency.includes(token.address) || Number(nativeValueSent) > 0)
}

function receivedBaseToken(interpretation: Interpretation): boolean {
    const { chainSymbol, nativeValueReceived } = interpretation
    const currency = getStablecoinOrNativeWrappedAddressesBySymbol(chainSymbol)
    return !!(
        interpretation.tokensReceived.find((token) => currency.includes(token.address)) ||
        Number(nativeValueReceived) > 0
    )
}

function sentOtherToken(interpretation: Interpretation): boolean {
    return interpretation.tokensSent.length > 0 && !sentBaseToken(interpretation)
}

function receivedOtherToken(interpretation: Interpretation): boolean {
    return interpretation.tokensReceived.length > 0 && !receivedBaseToken(interpretation)
}

function isAirdrop(interpretation: Interpretation, userAddress: Address, fromAddress: Address): boolean {
    if (interpretation.tokensReceived.length > 0 && userAddress !== fromAddress) {
        return true
    } else {
        return false
    }
}

function isClaimed(interpretation: Interpretation, userAddress: Address, fromAddress: Address): boolean {
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

function getAction(interpretation: Interpretation, userAddress: Address, fromAddress: Address): Action {
    // Order matters here, some are sub/super sets of others

    const isSentBaseToken = sentBaseToken(interpretation)
    const isSentOtherToken = sentOtherToken(interpretation)
    const isReceivedBaseToken = receivedBaseToken(interpretation)
    const isReceivedOtherToken = receivedOtherToken(interpretation)

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

function lastFallback(decodedData: Decoded, interpretation: Interpretation) {
    const { fromAddress, toAddress } = decodedData
    const { nativeValueReceived, nativeValueSent, chainSymbol, userAddress, tokensReceived, tokensSent } =
        interpretation

    interpretation.action = getAction(interpretation, userAddress, fromAddress)

    const valueSent =
        Number(nativeValueSent) > 0 ? nativeValueSent : tokensSent[0]?.amount || `#${tokensSent[0]?.tokenId}`

    const symbolSent = tokensSent[0]?.symbol || chainSymbol

    const valueReceived =
        Number(nativeValueReceived) > 0
            ? nativeValueReceived
            : tokensReceived[0]?.amount || `#${tokensReceived[0]?.tokenId}`

    const symbolReceived = tokensReceived[0]?.symbol || chainSymbol

    if (interpretation.action === Action.gotAirdropped) {
        interpretation.counterpartyName = fromAddress
        interpretation.exampleDescription = `${interpretation.userName} ${interpretation.action} ${interpretation.tokensReceived[0].symbol} from ${interpretation.counterpartyName}`
    } else if (
        interpretation.action === Action.received ||
        interpretation.action === Action.bought ||
        interpretation.action === Action.claimed
    ) {
        interpretation.counterpartyName = toAddress
        interpretation.exampleDescription = `${interpretation.userName} ${interpretation.action} ${valueReceived} ${symbolReceived} from ${interpretation.counterpartyName}`
    } else if (interpretation.action === Action.sold || interpretation.action === Action.sent) {
        interpretation.counterpartyName = toAddress
        interpretation.exampleDescription = `${interpretation.userName} ${interpretation.action} ${valueSent} ${symbolSent} to ${interpretation.counterpartyName}`
    } else if (interpretation.action === Action.traded) {
        interpretation.counterpartyName = toAddress
        interpretation.exampleDescription = `${interpretation.userName} ${interpretation.action} ${valueSent} ${symbolSent} for ${valueReceived} ${symbolReceived} with ${interpretation.counterpartyName}`
    }
}

export default lastFallback

/**
0xe8e0b0e5a46a21beef5b8d73753a306f737aa932e30614ec3c416e8d6effe878
"traded weth for car"

{
"nativeValueSent":"0"
"tokensReceived":[
0:{
"type":"ERC721"
"name":"CAR"
"symbol":"CAR"
"address":"0xa80617371a5f511bf4c1ddf822e6040acaa63e71"
"tokenId":"746"
}
]
"tokensSent":[
0:{
"type":"ERC20"
"name":"Wrapped Ether"
"symbol":"WETH"
"address":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
"amount":"0.369"
}
]
"chainSymbol":"ETH"
"userName":"brenner.eth"
"gasPaid":"0.010657716082272324"
"extra":{}
}

 */
