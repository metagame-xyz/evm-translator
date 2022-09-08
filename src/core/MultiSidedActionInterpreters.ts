import { Action, AssetType, Interpretation } from 'interfaces/interpreted'

export type MultiSidedActionInterpreter = (interpretation: Interpretation) => Action
type MultiSidedActionInterpreterMap = {
    [key in Action]?: MultiSidedActionInterpreter
}

const multiSidedActionInterpreters: MultiSidedActionInterpreterMap = {
    [Action.__NFTSALE__]: (interpretation: Interpretation): Action => {
        const nativeValueSent =
            interpretation.assetsSent.find((asset) => asset.type === AssetType.native)?.amount || '0'
        const nativeValueReceived =
            interpretation.assetsReceived.find((asset) => asset.type === AssetType.native)?.amount || '0'

        if (parseFloat(nativeValueSent) !== 0 && interpretation.assetsReceived.length) {
            return Action.bought
        } else if (parseFloat(nativeValueReceived) !== 0 && interpretation.assetsSent.length) {
            return Action.sold
        } else {
            console.log(
                `ERROR! Invalid NFT sale: received ${nativeValueReceived} ETH and ${interpretation.assetsReceived.length} tokens, sent ${nativeValueSent} ETH and ${interpretation.assetsSent.length} tokens`,
            )
            return Action.unknown
        }
    },
}

export default multiSidedActionInterpreters
