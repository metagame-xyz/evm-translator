const testTxHashes = {
    UniswapV2: {
        swapExactTokensForETHSupportingFeeOnTransferTokens:
            '0xd7be990f8849ec0b74d86fbda86eaf4c0cb25b814fb1ab9d2f056705b2fdfba6',
        swapExactETHForTokens: '0x32706fd90e141319710989feb555d6c9e394b1788802df6281d257cda0701c84',
        swapExactTokensForTokens: '0xb684992cdec31d2eeaf3866be82ddd2a9cfe2211bab96b1aa132d3a9ae50587b',
        addLiquidityETH: '0xb78ce1e0f55e78cf005b4b5af9978b3d20292dc8c88c94f7ecade67083e2b97f',
        removeLiquidityWithPermit: '0x967963d6eaad9e65d567cac325728d79aeaa319b1453e05ec55734f3b08445ec',
        removeLiquidityETHWithPermit: '0x3dd8f41c008a6ce59ca8d2b24df700dc4441d0a83747b9b7c0587449a2e7c9ca',
    },
    WyvernOpenSea: {
        atomicMatch_: '0xc814cb6b61222beda8a9bcc359e776e72ae732a1c29df572099ecef27c8461e4',
    },
    AaveV2: {
        repay: '0xdf2f782ab0296121318cca140ef069f9f074c51ff4b11f0c677bcb01126f81de',
        deposit: '0x24ee705da17a6061091880f47335d92950c72398980e271cdb9c69e8502827f4',
        withdraw: '0x8df7e436048d687edfaf351e913783729eeaa9ece741391b2a8428d6b7762fe1',
        borrow: '0x564544c9aef01836615254504677b91a9ef96d5ae15eac50d98e08774ed1096c',
    },
    UniswapV3: {
        exactInputSingle: '0xe4737f2b6174dfcc9482a50aacdc0a919f12c14ede767d6dbfc2cd502747e4f5',
        exactInput: '0xf41a45f5347db0d95bfac48325f8272dce56782574e91083e5025324928bc40c',
        exactOutputSingle: '0xce57de79e8898075e6512492b47661abd8e74eeffe4760cd43c054b53480b583',
        exactOutput: '0x26854093b17b25f74bcdb8728a6c8d113e68aa69f2ae2463f9c14788df53aa45',
        multicall: '0x5efd5c0a1d3b1a0b42456aae4fc552e0924d8153f68196b011ef933b94614246',
    },
    UniswapV3NonFungiblePositionManager: {
        burn: '0x1d2e706317c9457e43d4b0dfe6395c55b518f4f05386d1f455dd6ea984e04ae1',
        collect: '0x8d696e7ac40e22c25207a6eb3060d840fe4b1b4663fb988500f3bfc311da2a39',
        increaseLiquidity: '0xba7e346f46b1f5fa3bbff9868f1b6bf170b8fc8d212d2ad8e6f9fc84acdf30a1',
        mint: '0x8f97a7c09cb73c4da2de03f21bbf17c01f512a615da51a8bf721c4748b5f8475',
        multicall: '0xb38f55471c5a8539a605287b4116a4bf83a58261b3cfe00bc53337298003b9ae',
        multicall_2: '0x8dbab0967c491942e748c7fc305a3f9a3b2eb6c54c0dc48e1ba7f43babfc636a',
    },
    CompoundETH: {
        mint: '0xbbb448dcb3b7e7216c609a97346d9f0553a29cdc8917a286c2aa00a1ba3fccde',
        borrow: '0x5ced82f63bdbe55eaee49392afca90bf23473ba93d43eb5159e586fa8d343986',
        redeem: '0xdaf683d90248db147b1fb22b3979c1902e7ad57ae1c46bc1f8293601cfa5e154',
    },
    CompoundERC20: {
        mint: '0x37182c6beeed11222cd8a4f81fb897ae6fefb31c64c634fea3a277afdba9dd11',
        borrow: '0x669b67fa88c60b07d892f09a87c24dd7bd691bdcbd7b1eb0efd969096067f1a6',
        redeem: '0x63a27f1f7e10fd37477e3e4c35986adb58daaa4b8ab541909a54cb43b0aed5aa',
        repayBorrow: '0xc5380c861d5817a30b42442f32f93cdc91e1ca395b607ec4ecd9e9cf5fc3c2b9',
    },
    ENS: {
        safeTransferFrom: '0x03daff6bd6d1b9792ff1973a1d5104b14fa76fcea6165eb821076cda7f4b2624',
        setApprovalForAll: '0xfc52130191555ad7892906f1d018945b7b45034fb200dbe6945579fef6fe07b5',
        reclaim: '0x100ee7ec909ddd63c03d33261f6658b4050216e63c7a87fa2ccfff32c1d4a7e6',
        registerWithConfig: '0xd3f7d0c363f5dc8c7e8d4285afcc0d40063a661075619b09d93105d81200749b',
        renew: '0xcc8a09291cf751d8714289ded45a7ae7b7b2d52560ab120f50b75a771e97a969',
        setName: '0x419feb4f564baacf3ca6643ac0a4dc00ee76334cdb6fd17f2ee3929278b86d7c',
    },
    generic: {
        mintErc1155: '0x737a57f5de926d43d2118d4e5fbeb552d68b4b8a68e4f801e1e6641960462b06',
    },
    WETH: {
        deposit: '0xe6e922f5330aa913012fb6844aa0a401a10e1b0807eb3a3f4133e9af78d1b3ca',
    },
    Zapper: {
        craft: '0x5aaf520a85cb38e6183799c482de919b7fc64b486cc80660d0aa8f683065825e',
        claimVolts: '0x43363e57ee9d29572fae040cfeacd6107853f28292cc687318e3b7c4d4a3272c',
        mint: '0x6b839c1d519f2f6b11eb304d5cc185b7b367278150b0fe3109084aa0ed78cfb2',
        redeem: '0xf1f6e7aff98668f78398871484bdcd50afc12a923029a6c025f8835a3ef4a936',
    },
    SushiSwap: {
        addLiquidity: '0x77c810424f1493f0059ae11af084f5fea1d32654b9e6bf28fe7ea1eadd822432',
        addLiquidityETH: '0x21a385a77f3b99a83dda54ef36dbf4156522af0015eb68541693400b9b72d374',
        removeLiquidity: '0x8c0e9eb2a88c710f79487ddfd8f9df7806c938fc82025a7810cf09ec68727e26',
        removeLiquidityETH: '0x5c02ad31a4c7d33ba222c340c4d5f834f7965877c426701a6616e5b3809a6dc6',
        removeLiquidityETHSupportingFeeOnTransferTokens:
            '0xcd93f9a98673117e5c8bcbda0b9ec8d18b5d4450f1fa339f5ff14c31f8fe201b',
        removeLiquidityETHWithPermit: '0x7a9059dbe5f9baea798147bb4a9efc36608e3693f7358872cafd020a4c16c910',
        removeLiquidityETHWithPermitSupportingFeeOnTransferTokens:
            '0x26c8c6f27845a2462035e71e382b9c6b241f9a5e414c94eb74f5cd24ebe9a772',
        removeLiquidityWithPermit: '0xfaababf2a3dec98d2b6ac4055151995ce89ffce74a1d7f72afa353ce036e1b20',
        swapETHForExactTokens: '0xb6d5e2c3bec38fea8ad724a4a726c9a28e221923c8d101739e7b869947c49e5c',
        swapExactETHForTokens: '0xacd7a3ce8f76c697517c72e6aba10eb4012edbe0e90ebf7920f75640cf27d42a',
        swapExactETHForTokensSupportingFeeOnTransferTokens:
            '0xe8179de2fba98287f09671beeabf16875465e977716d219a67d1df736108b756',
        swapExactTokensForETH: '0x69a0f4c2d728ca7dffdc7d1cb56742c5dbfb43bcdee081eea68f97c6ccbb6806',
        swapExactTokensForETHSupportingFeeOnTransferTokens:
            '0x6cbddbccbe403f4b5d67295527d5e061e0819a561a1977c3c97e81990fffc0a9',
        swapExactTokensForTokens: '0xff082dbc9b6b2135b41fda2b46ce642c3b29db22ba3fe14fc10be87f0b721839',
        swapExactTokensForTokensSupportingFeeOnTransferTokens:
            '0x551e05368ecbedad6f7d6ec8f407d60e84d30b8a93e815a2b52a19e481584715',
        swapTokensForExactETH: '0x50886b0742fef7b3abb30427b5c4c8bcee4be2c0543d086740f0534546623cbd',
        swapTokensForExactTokens: '0xc7070e2bdd0e5e3558450c546ec173005bb2a0f488907ee709a320c07da166cd',
    },
    BatchTransfer: {
        batchTransfer: '0x4b86cff9a093e7c29ad86c3816e1f8e867f0264f6fc1052f57668a19b024b092',
    },
    DisperseApp: {
        disperseTokenSimple: '0xbaf7354913380992f641ba1eb3345641069af4811bfa93356c4a148c7f951ba3',
        disperseToken: '0x4f32fc855204597a1c3bf5dad15e1636ca1a56bc920578a5b233c50ce0035853',
        disperseEther: '0x0218f4ea6f52110919badb90636cc72563e5b80160f7fcf575df9dca1fe8eb9c',
    },
    Aztec: {
        depositPendingFunds: '0x1aef69ed1bd6e9a8d43c72b54c1fea18355ca236292bdb6e9d0f0cf2864730ec',
    },
}

// test multiple roles for a single tx
export const multiSidedTxMap: Record<string, string[]> = {
    '0xc814cb6b61222beda8a9bcc359e776e72ae732a1c29df572099ecef27c8461e4': [
        '0x96a675775b8546a8602a1015efaacbc87358e478',
        '0x83eb387c8f7c8903f2be1ca367197fc4b3cb573e',
    ],
}

export function flattenTxHashes() {
    const testTxHashesArr = Object.values(testTxHashes)
    const flattenedTxHashes = testTxHashesArr.reduce((prev: string[], cur) => [...prev, ...Object.values(cur)], [])
    return flattenedTxHashes
}

export default testTxHashes
