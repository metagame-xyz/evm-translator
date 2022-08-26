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
    GnosisSafe: {},
    Asks: {
        cancelAsk: '0xd440008541440e933afeecb6b6ca224750791b6b8d581f1d0a9b1297094b20f0',
        createAsk: '0xa2c269f7d5242e89353f9bb28aa61783ed3337899eea28fbac9b9fa848d5580e',
        fillAsk: '0xaab2e7717aa80d1163415a9a43f031dfd117ff21a180b640d11c7bdaec05698a',
        setAskPrice: '0x267566ad876126ae6973fcc149b1e30c63643156750e9ed0e51f55adf958f00f',
    },
}

// test multiple roles for a single tx
export const multiSidedTxMap: Record<string, string[]> = {
    '0xc814cb6b61222beda8a9bcc359e776e72ae732a1c29df572099ecef27c8461e4': [
        '0x96a675775b8546a8602a1015efaacbc87358e478',
        '0x83eb387c8f7c8903f2be1ca367197fc4b3cb573e',
    ],
    '0xaab2e7717aa80d1163415a9a43f031dfd117ff21a180b640d11c7bdaec05698a': [
        '0x3612566e49770fd3137d0c3c2fcf35d5916a2452',
        '0x6170b3c3a54c3d8c854934cbc314ed479b2b29a3',
    ],
}

export function flattenTxHashes() {
    const testTxHashesArr = Object.values(testTxHashes)
    const flattenedTxHashes = testTxHashesArr.reduce((prev: string[], cur) => [...prev, ...Object.values(cur)], [])
    return flattenedTxHashes
}

export default testTxHashes
