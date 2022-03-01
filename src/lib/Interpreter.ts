import { ActivityEntry } from './Activity'
import Inspector, { Config, InspectorResult } from './Inspector'
import ContractDeploy from './inspectors/ContractDeploy'
import ContractInteraction from './inspectors/ContractInteraction'
import ENSRenewal from './inspectors/ENSRenewal'
import ETHTransfer from './inspectors/ETHTransfer'
import ExternalInteraction from './inspectors/ExternalInteraction'
import MintReceived from './inspectors/MintReceived'
import NFTMint from './inspectors/NFTMint'
import TokensSent from './inspectors/TokensSent'
import OpenSeaBuy from './inspectors/OpenSeaBuy'
import OpenSeaCancel from './inspectors/OpenSeaCancel'
import TokensReceived from './inspectors/TokensReceived'
import UniswapV2Swap from './inspectors/UniswapV2Swap'
import LooksRareSale from './inspectors/LooksRareSale'
import TokenApproval from './inspectors/TokenApproval'
import SpamTransaction from './inspectors/SpamTransaction'

const INSPECTORS = [
	/* Specific Providers */
	new OpenSeaBuy(),
	new OpenSeaCancel(),
	new ENSRenewal(),
	new UniswapV2Swap(),
	new LooksRareSale(),

	/* General Sent */
	new TokensSent(),
	new NFTMint(),
	new TokenApproval(),

	/* General Received */
	new TokensReceived(),
	new MintReceived(),

	/* Spam Filter */
	new SpamTransaction(),

	/* Fallbacks */
	new ContractInteraction(),
	new ExternalInteraction(),

	/* Other */
	new ETHTransfer(),
	new ContractDeploy(),
]

class Interpreter {
	#inspectors: Array<Inspector> = INSPECTORS

	public augment(entry: ActivityEntry, config: Config): InspectorResult {
		try {
			return this.#inspectors.find(inspector => inspector.check(entry, config)).resolve(entry, config)
		} catch (error) {
			if (process.env.NODE_ENV === 'production') return { hideTransaction: true }

			throw error
		}
	}
}

export default new Interpreter()
