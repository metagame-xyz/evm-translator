import { DecodedTx, InteractionEvent } from 'interfaces/decoded'
import { Action, Interpretation } from 'interfaces/interpreted'

import { logWarning } from 'utils/logging'

function isExecutionSuccessEvent(event: InteractionEvent) {
    return event.eventName === 'ExecutionSuccess'
}

function interpretGnosisExecution(decodedData: DecodedTx, interpretation: Interpretation) {
    const { toAddress, interactions, fromAddress } = decodedData
    const { userName, userAddress } = interpretation

    const action = userAddress === fromAddress ? Action.executed : Action.involved

    const tokenContractInteraction = interactions.find((interaction) => interaction.contractAddress === toAddress)
    const tokenEvents = tokenContractInteraction?.events || []

    const gnosisName = decodedData.toENS || toAddress?.slice(0, 6)

    const isExecutionSuccess = tokenEvents.find((e) => isExecutionSuccessEvent(e))

    const exampleDescription = `${userName} ${action} a transaction on a Gnosis Safe (${gnosisName})`

    interpretation.actions.push(action)
    interpretation.exampleDescription = exampleDescription
    interpretation.extra = {}
}

export default interpretGnosisExecution
