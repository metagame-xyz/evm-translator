import Translator from 'Translator'
import InterepterTemplateGenerator from 'utils/generateInterpreter'

export { createEthersAPIKeyObj } from 'Translator'
export { chains } from 'utils'

export { InterepterTemplateGenerator }
/* Inferfaces */
export { Address, Chain, Chains } from 'interfaces'
export { CovalentTxData as TxData, CovalentConfig, GetTransactionsResponse } from 'interfaces/covalent'
export { KeywordMap, MethodMap, InterpreterMap } from 'interfaces/contractInterpreter'

export default Translator
