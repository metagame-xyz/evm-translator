import { DecodedTx, InteractionEvent } from 'interfaces/decoded'
import { Action, AssetType, Interpretation } from 'interfaces/interpreted'

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
    const { userAddress, chainSymbol, userName } = interpretation
    const sending = fromAddress === userAddress

    const action: Action = sending ? Action.sent : Action.received
    const direction = sending ? 'to' : 'from'

    const tokenContractInteraction = interactions.find((interaction) => interaction.contractAddress === toAddress)
    const tokenEvents = tokenContractInteraction?.events || []

    const isSafeReceived = tokenEvents.find((e) => isSafeReceivedEvent(e, userAddress))

    let counterpartyName = null
    let amountSent = interpretation.assetsSent.find((asset) => asset.type === AssetType.native)?.amount
    if (isSafeReceived && sending) {
        // TODO confirm safeReceived is decoded
        counterpartyName = `Gnosis Safe ${decodedData.toENS || toName}`
    } else if (sending) {
        counterpartyName = decodedData.toENS || toName
    } else {
        counterpartyName = decodedData.fromENS || fromName
        amountSent = interpretation.assetsReceived.find((asset) => asset.type === AssetType.native)?.amount
    }

    const exampleDescription = `${userName} ${action} ${amountSent} ${chainSymbol} ${direction} ${counterpartyName}`

    interpretation.actions = [action]
    interpretation.exampleDescription = exampleDescription
    interpretation.extra = {}

    if (counterpartyName) {
        interpretation.counterpartyName = counterpartyName
    }
}

export default interpretGenericTransfer
