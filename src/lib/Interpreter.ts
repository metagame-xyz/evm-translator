import {
	NFTMint,
	Fallback,
	WrapEther,
	ENSRenewal,
	TokensSent,
	OpenSeaBuy,
	GnosisCall,
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
	PolygonBridge,
	SpamTransaction,
	JuiceboxContribution,
	FailedTransaction,
} from './inspectors'
import OxSwap from './inspectors/0xSwap'
import { ActivityEntry } from './Activity'
import Inspector, { Config, InspectorError, InspectorResult } from './Inspector'
import ContractInteraction from './inspectors/ContractInteraction'
import ExternalInteraction from './inspectors/ExternalInteraction'

const INSPECTORS: Array<Inspector> = [
	/* Hide failed transactions */
	new FailedTransaction(),

	/* Specific Providers */
	new AaveDeposit(),
	new OxSwap(),
	new OpenSeaBuy(),
	new OpenSeaCancel(),
	new ENSRenewal(),
	new UniswapV2Swap(),
	new LooksRareSale(),
	new JuiceboxContribution(),
	new GnosisCall(),
	new WrapEther(),
	new PolygonBridge(),

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
		const inspector = this.#inspectors.find(inspector => inspector.check(entry, config))

		try {
			return inspector.resolve(entry, config)
		} catch (error) {
			throw new InspectorError(inspector, entry, error)
		}
	}
}

export default new Interpreter()
