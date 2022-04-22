import { Action, Address, Decoded, Interpretation } from 'interfaces'

function interpretGenericTransfer(decodedData: Decoded, interpretation: Interpretation, userAddress: Address) {
    const action: Action = decodedData.fromAddress === userAddress ? 'sent' : 'received'

    const counterpartyName =
        decodedData.fromAddress === userAddress
            ? decodedData.toENS || decodedData.toAddress?.slice(0, 6)
            : decodedData.fromENS || decodedData.fromAddress.slice(0, 6)

    const exampleDescription = `${interpretation.userName} ${action} ${counterpartyName} ${decodedData.nativeTokenValueSent} ${decodedData.nativeTokenSymbol}`

    interpretation.action = action
    interpretation.exampleDescription = exampleDescription
    interpretation.extra = {}

    if (counterpartyName) {
        interpretation.counterpartyName = counterpartyName
    }
}

export default interpretGenericTransfer
