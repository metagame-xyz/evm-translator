import Translator from 'Translator'
import Translator2 from 'Translator2'
import InterpreterTemplateGenerator from 'utils/generateInterpreter'

export { createEthersAPIKeyObj } from 'Translator'
export { chains } from 'utils'

export { InterpreterTemplateGenerator }
export { Translator2 }
/* Interfaces */
export { Chain, Chains } from 'interfaces'
export { CovalentTxData as TxData, CovalentConfig, GetTransactionsResponse } from 'interfaces/covalent'
export { KeywordMap, MethodMap, InterpreterMap } from 'interfaces/contractInterpreter'

export default Translator
