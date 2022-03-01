import {
	NFTMint,
	ENSRenewal,
	TokensSent,
	OpenSeaBuy,
	GeneralSwap,
	ETHTransfer,
	AaveDeposit,
	MintReceived,
	UniswapV2Swap,
	LooksRareSale,
	TokenApproval,
	OpenSeaCancel,
	TokensReceived,
	ContractDeploy,
	SpamTransaction,
} from './inspectors'
import logger from './logger'
import OxSwap from './inspectors/0xSwap'
import { ActivityEntry } from './Activity'
import Inspector, { Config, InspectorResult } from './Inspector'
import ContractInteraction from './inspectors/ContractInteraction'
import ExternalInteraction from './inspectors/ExternalInteraction'

const INSPECTORS: Array<Inspector> = [
	/* Specific Providers */
	new AaveDeposit(),
	new OxSwap(),
	new OpenSeaBuy(),
	new OpenSeaCancel(),
	new ENSRenewal(),
	new UniswapV2Swap(),
	new LooksRareSale(),

	/* General Sent */
	new TokensSent(),
	new NFTMint(),
	new TokenApproval(),
	new GeneralSwap(),

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

			logger.debug(entry)
			throw error
		}
	}
}

export default new Interpreter()
