import Translator from 'Translator'
import InterepterTemplateGenerator from 'utils/generateInterpreter'

export { createEthersAPIKeyObj } from 'Translator'
export { chains } from 'utils'

export { InterepterTemplateGenerator }

/* Inferfaces */
export { CovalentTxData as TxData, CovalentConfig, GetTransactionsResponse } from 'interfaces/covalent'
export { Address, Chain, Chains } from 'interfaces'

export default Translator
