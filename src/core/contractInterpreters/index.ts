const contractInterpreters = {
    '0xd569d3cce55b71a8a3f3c418c329a66e5f714431': require('./TerminalV1_0xd569.json'),
    '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': require('./UniswapV2Router02_0x7a25.json'),
    '0x7f268357a8c2552623316e2562d90e642bb538e5': require('./WyvernExchangeWithBulkCancellations_0x7f26.json'),
    '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9': require('./AaveV2LendingPool_0x7d27.json'),
    '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5': require('./Compound_ETH.json'), // cETH
    '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643': require('./Compound_ERC20.json'), // cDAI
    '0xe65cdb6479bac1e22340e4e755fae7e509ecd06c': require('./Compound_ERC20.json'), // cAAVE
    '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e': require('./Compound_ERC20.json'), // cBAT
    '0x70e36f6bf80a52b3b46b3af8e106cc0ed743e8e4': require('./Compound_ERC20.json'), // cCOMP
    '0x7713dd9ca933848f6819f38b8352d9a15ea73f67': require('./Compound_ERC20.json'), // cFEI
    '0xface851a4921ce59e912d19329929ce6da6eb0c7': require('./Compound_ERC20.json'), // cLINK
    '0x95b4ef2869ebd94beb4eee400a99824bf5dc325b': require('./Compound_ERC20.json'), // cMKR
    '0x158079ee67fce2f58472a96584a73c7ab9ac95c1': require('./Compound_ERC20.json'), // cREP
    '0xf5dce57282a584d2746faf1593d3121fcac444dc': require('./Compound_ERC20.json'), // cSAI
    '0x4b0181102a0112a2ef11abee5563bb4a3176c9d7': require('./Compound_ERC20.json'), // cSUSHI
    '0x12392f67bdf24fae0af363c24ac620a2f67dad86': require('./Compound_ERC20.json'), // cTUSD
    '0x35a18000230da775cac24873d00ff85bccded550': require('./Compound_ERC20.json'), // cUNI
    '0x39aa39c021dfbae8fac545936693ac917d5e7563': require('./Compound_ERC20.json'), // cUSDC
    '0x041171993284df560249b57358f931d9eb7b925d': require('./Compound_ERC20.json'), // cUSDP
    '0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9': require('./Compound_ERC20.json'), // cUSDT
    '0xc11b1268c1a384e55c48c2391d8d480264a3a7f4': require('./Compound_ERC20.json'), // cWBTC
    '0xccf4429db6322d5c611ee964527d42e5d685dd6a': require('./Compound_ERC20.json'), // cWBTC2
    '0x80a2ae356fc9ef4305676f7a3e2ed04e12c33946': require('./Compound_ERC20.json'), // cYFI
    '0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407': require('./Compound_ERC20.json'), // cZRX
    '0xe592427a0aece92de3edee1f18e0157c05861564': require('./UniswapV3Router.json'),
    '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': require('./UniswapV3Router.json'),
    '0xc36442b4a4522e871399cd717abdd847ab11fe88': require('./UniswapV3NonFungiblePositionManager.json'),
    '0x283af0b28c62c092c9727f1ee09c02ca627eb7f5': require('./ENSRegistrarController_0x283a.json'), // registering names
    '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85': require('./ENSBaseRegistrar_0x57f1.json'), // transferring names
    '0x084b1c3c81545d370f3634392de611caabff8148': require('./ENSReverseRegistrar_0x084b.json'), // setting default names
    '0xa6b71e26c5e0845f74c812102ca7114b6a896ab2': require('./GnosisSafeProxyFactory_0xa6b7.json'),
    '0x7be8076f4ea4a4ad08075c2508e481d6c946d12b': require('./WyvernExchange_0x7be8.json'),
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': require('./WETH9_0xc02a.json'),
    '0xf1f3ca6268f330fda08418db12171c3173ee39c9': require('./ZapperNFT_0xeabb.json'),
    '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F': require('./SushiSwap_0xd9e1.json'),
    '0x2e2234b3a848f895a60b2071f90303cd02f7491d': require('./BatchTransfer_0x2e22.json'),
    '0xd152f549545093347a162dce210e7293f1452150': require('./DisperseApp_0xd152.json'),
    '0xaBEA9132b05A70803a4E85094fD0e1800777fBEF': require('./zkSync_0xaBEA.json'),
    // '0x0baccdd05a729ab8b56e09ef19c15f953e10885f': require('./NFTLoanFacilitator_0x0bac.json'), will add once filled out
}

export default contractInterpreters
