import { Action, Address, Decoded, Interpretation, RawTxData } from 'interfaces'
import { fillDescriptionTemplate } from 'utils'
import { blackholeAddress } from 'utils/constants'

function isMintEvent(event: any, userAddress: Address) {
    return event.event === 'Transfer' && event.from === blackholeAddress && event.to === userAddress
}

function interpretGenericERC721(rawTxData: RawTxData, decodedData: Decoded, interpretation: Interpretation) {
    let action: Action = '______TODO______'
    let tokenIds: string[] = []
    let exampleDescriptionTemplate = '______TODO______'

    const tokenContractInteraction = decodedData.interactions.find(
        (interaction) => interaction.contractAddress === decodedData.toAddress,
    )
    const tokenEvents = tokenContractInteraction?.events || []

    if (tokenEvents.find((e) => isMintEvent(e, decodedData.fromAddress))) {
        action = 'minted'
    }

    if (action === 'minted') {
        tokenIds = tokenEvents.filter((e) => isMintEvent(e, decodedData.fromAddress)).map((e) => e.tokenId as string)

        if (tokenIds.length === 1) {
            exampleDescriptionTemplate = '{userName} minted {tokenSymbol} #{tokenId} from {tokenName}'
        } else {
            exampleDescriptionTemplate = '{userName} minted {tokenCount} {tokenSymbol}s from {tokenName}'
        }
    }

    interpretation.action = action
    interpretation.extra = {
        tokenName: tokenContractInteraction?.contractName,
        tokenSymbol: tokenContractInteraction?.contractSymbol,
        tokenAddress: decodedData.toAddress,
    }

    if (tokenIds.length > 0) {
        interpretation.extra.tokenIds = tokenIds
        interpretation.extra.tokenCount = tokenIds.length.toString()
    }
    if (tokenIds.length === 1) {
        interpretation.extra.tokenId = tokenIds[0]
    }

    interpretation.exampleDescription = fillDescriptionTemplate(exampleDescriptionTemplate, interpretation)
}

export default interpretGenericERC721
