import {
	NFTMint,
	Fallback,
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

	/* Sent Transactions */
	new TokensSent(),
	new NFTMint(),
	new TokenApproval(),
	new GeneralSwap(),

	/* Received Transactions */
	new TokensReceived(),
	new MintReceived(),

	/* Spam Filter */
	new SpamTransaction(),

	/* General */
	new ContractInteraction(),
	new ExternalInteraction(),

	/* Other */
	new ETHTransfer(),
	new ContractDeploy(),
	new Fallback(),
]

class Interpreter {
	#inspectors: Array<Inspector> = INSPECTORS

	public augment(entry: ActivityEntry, config: Config): InspectorResult {
		return this.#inspectors.find(inspector => inspector.check(entry, config)).resolve(entry, config)
	}
}

export default new Interpreter()
