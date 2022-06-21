const contractInterpreters = {
    '0xd569d3cce55b71a8a3f3c418c329a66e5f714431': require('./TerminalV1_0xd569.json'),
    '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': require('./UniswapV2Router02_0x7a25.json'),
    '0x7f268357a8c2552623316e2562d90e642bb538e5': require('./WyvernExchangeWithBulkCancellations_0x7f26.json'),
    '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9': require('./AaveV2LendingPool_0x7d27.json'),
}

export default contractInterpreters
