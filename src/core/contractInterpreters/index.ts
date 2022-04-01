import JuiceboxContribution from './JuiceboxContribution'
import OpenSea from './OpenSea'
import { InterpreterMap } from 'interfaces/contractInterpreter'

const contractInterpreters = {
    '0xd569d3cce55b71a8a3f3c418c329a66e5f714431': JuiceboxContribution,
    // '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': JSON.parse('./UniswapV2Router02_0x7a25.json'),
    '0x7f268357a8c2552623316e2562d90e642bb538e5': OpenSea,
}

export default contractInterpreters as Record<string, InterpreterMap>
