import { Action, Address, Decoded, InteractionEvent, Interpretation } from 'interfaces'
import { ensure } from 'utils'

function isSafeReceivedEvent(event: InteractionEvent, userAddress: Address) {
    return event.event === 'SafeReceived' && event.sender === userAddress
}

function interpretGenericTransfer(decodedData: Decoded, interpretation: Interpretation, userAddress: Address) {
    const { fromAddress, toAddress, interactions } = decodedData
    const sending = fromAddress === userAddress

    const action: Action = sending ? 'sent' : 'received'
    const direction = sending ? 'to' : 'from'

    const tokenContractInteraction = ensure(
        interactions.find((interaction) => interaction.contractAddress === toAddress),
    )
    const tokenEvents = tokenContractInteraction?.events || []

    const isSafeReceived = tokenEvents.find((e) => isSafeReceivedEvent(e, userAddress))

    let counterpartyName = null
    if (isSafeReceived && sending) {
        counterpartyName = `Gnosis Safe ${decodedData.toENS || toAddress?.slice(0, 6)}`
    } else if (sending) {
        counterpartyName = decodedData.toENS || toAddress?.slice(0, 6)
    } else {
        counterpartyName = decodedData.fromENS || fromAddress.slice(0, 6)
    }

    const exampleDescription = `${interpretation.userName} ${action} ${decodedData.nativeTokenValueSent} ${decodedData.nativeTokenSymbol} ${direction} ${counterpartyName}`

    interpretation.action = action
    interpretation.exampleDescription = exampleDescription
    interpretation.extra = {}

    if (counterpartyName) {
        interpretation.counterpartyName = counterpartyName
    }
}

export default interpretGenericTransfer
