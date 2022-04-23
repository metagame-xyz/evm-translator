const contractInterpreters = {
    '0xd569d3cce55b71a8a3f3c418c329a66e5f714431': require('./TerminalV1_0xd569.json'),
    '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': require('./UniswapV2Router02_0x7a25.json'),
    '0x7f268357a8c2552623316e2562d90e642bb538e5': require('./WyvernExchangeWithBulkCancellations_0x7f26.json'),
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': require('./WETH9_0xc02a.json'),
}

export default contractInterpreters
