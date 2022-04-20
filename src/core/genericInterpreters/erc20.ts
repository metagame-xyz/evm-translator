import { Action, Address, Decoded, InteractionEvent, Interpretation, Token } from 'interfaces'
import { blackholeAddress } from 'utils/constants'

function isMintEvent(event: any, userAddress: Address) {
    return event.event === 'Transfer' && event.from === blackholeAddress && event.to === userAddress
}

function isSendEvent(event: any, userAddress: Address) {
    return event.event === 'Transfer' && event.from === userAddress
}

function isReceiveEvent(event: any, userAddress: Address) {
    return event.event === 'Transfer' && event.to === userAddress
}

function getAction(events: InteractionEvent[], userAddress: Address): Action {
    const isMint = events.find((e) => isMintEvent(e, userAddress))
    const isSend = events.find((e) => isSendEvent(e, userAddress))
    const isReceive = events.find((e) => isReceiveEvent(e, userAddress))

    if (isMint) {
        return 'minted'
    } else if (isSend) {
        return 'sent'
    } else if (isReceive) {
        return 'received'
    }

    return '______TODO______'
}

function getTokenInfo(interpretation: Interpretation, action: Action): Token {
    switch (action) {
        case 'minted':
        case 'received':
            return interpretation.tokensReceived[0]
        case 'sent':
        default:
            return interpretation.tokensSent[0]
    }
}

function interpretGenericERC20(decodedData: Decoded, interpretation: Interpretation, userAddress: Address) {
    let exampleDescription = '______TODO______'
    let counterpartyNames: string[] = []

    const tokenContractInteraction = decodedData.interactions.find(
        (interaction) => interaction.contractAddress === decodedData.toAddress,
    )
    const tokenEvents = tokenContractInteraction?.events || []

    const action = getAction(tokenEvents, userAddress)

    console.log(interpretation)

    const { name, symbol, amount } = getTokenInfo(interpretation, action)

    if (action === 'minted') {
        exampleDescription = `${interpretation.userName} ${action} ${amount} $${symbol || '???'} from ${name}`
    }
    if (action === 'received') {
        const userName = tokenEvents
            .filter((e) => isReceiveEvent(e, userAddress))
            .map((e) => e.toENS || (e.to as string))[0]

        interpretation.userName = userName

        counterpartyNames = tokenEvents
            .filter((e) => isReceiveEvent(e, userAddress))
            .map((e) => e.fromENS || (e.from.slice(0, 6) as string))

        exampleDescription = `${interpretation.userName}  ${action} ${amount} $${symbol || '???'} from ${
            counterpartyNames[0]
        }`
    }

    if (action === 'sent') {
        counterpartyNames = tokenEvents
            .filter((e) => isSendEvent(e, userAddress))
            .map((e) => e.toENS || (e.to as string))

        exampleDescription = `${interpretation.userName}  ${action} ${amount} $${symbol || '???'} to ${
            counterpartyNames[0]
        }`
    }

    interpretation.action = action
    interpretation.exampleDescription = exampleDescription
    interpretation.extra = {}

    if (counterpartyNames.length > 1) {
        interpretation.extra.counterpartyNames = counterpartyNames
    }
    if (counterpartyNames.length === 1) {
        interpretation.counterpartyName = counterpartyNames[0]
    }
}

export default interpretGenericERC20
