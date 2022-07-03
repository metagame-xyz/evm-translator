import { DecodedTx, InteractionEvent } from 'interfaces/decoded'
import { Action, Interpretation } from 'interfaces/interpreted'

function isSafeReceivedEvent(event: InteractionEvent, userAddress: string) {
    return event.eventName === 'SafeReceived' && event.params.sender === userAddress
}

function interpretGenericTransfer(
    decodedData: DecodedTx,
    interpretation: Interpretation,
    fromName: string,
    toName: string,
) {
    const { fromAddress, toAddress, interactions } = decodedData
    const { userAddress, nativeValueSent, chainSymbol, userName } = interpretation
    const sending = fromAddress === userAddress

    const action: Action = sending ? Action.sent : Action.received
    const direction = sending ? 'to' : 'from'

    const tokenContractInteraction = interactions.find((interaction) => interaction.contractAddress === toAddress)
    const tokenEvents = tokenContractInteraction?.events || []

    const isSafeReceived = tokenEvents.find((e) => isSafeReceivedEvent(e, userAddress))

    let counterpartyName = null
    if (isSafeReceived && sending) {
        // TODO confirm safeReceived is decoded
        counterpartyName = `Gnosis Safe ${decodedData.toENS || toName}`
    } else if (sending) {
        counterpartyName = decodedData.toENS || toName
    } else {
        counterpartyName = decodedData.fromENS || fromName
    }

    const exampleDescription = `${userName} ${action} ${nativeValueSent} ${chainSymbol} ${direction} ${counterpartyName}`

    interpretation.action = action
    interpretation.exampleDescription = exampleDescription
    interpretation.extra = {}

    if (counterpartyName) {
        interpretation.counterpartyName = counterpartyName
    }
}

export default interpretGenericTransfer
