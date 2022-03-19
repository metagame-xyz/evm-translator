import UniswapV2 from './UniswapV2'
import JuiceboxContribution from './JuiceboxContribution'

const contractInterpreters = {
    '0xd569d3cce55b71a8a3f3c418c329a66e5f714431': JuiceboxContribution,
    '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': UniswapV2,
}

export default contractInterpreters
