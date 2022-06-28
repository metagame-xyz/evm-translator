import { DecodedTx, InteractionEvent } from 'interfaces/decoded'
import { Action, Interpretation } from 'interfaces/interpreted'

import { logWarning } from 'utils/logging'

function isExecutionSuccessEvent(event: InteractionEvent) {
    return event.eventName === 'ExecutionSuccess'
}

function interpretGnosisExecution(decodedData: DecodedTx, interpretation: Interpretation) {
    const { fromAddress, toAddress, interactions } = decodedData
    const { userAddress, userName } = interpretation

    const action = Action.executed

    const tokenContractInteraction = interactions.find((interaction) => interaction.contractAddress === toAddress)
    const tokenEvents = tokenContractInteraction?.events || []

    const counterpartyName = decodedData.toENS || toAddress?.slice(0, 6)

    const isExecutionSuccess = tokenEvents.find((e) => isExecutionSuccessEvent(e))

    if (!isExecutionSuccess) {
        logWarning(
            {
                txHash: decodedData.txHash,
                address: toAddress || undefined,
                functionName: 'interpretGnosisExecution',
            },
            'Gnosis tx didnt include ExecutionSuccess event',
        )
    }

    const exampleDescription = `${userName} ${action} a transaction on a Gnosis Safe (${counterpartyName})`

    interpretation.action = action
    interpretation.exampleDescription = exampleDescription
    interpretation.extra = {}
}

export default interpretGnosisExecution
