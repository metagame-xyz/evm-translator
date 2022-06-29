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
    },
    UniswapV3: {
        exactInputSingle: '0xe4737f2b6174dfcc9482a50aacdc0a919f12c14ede767d6dbfc2cd502747e4f5',
        exactInput: '0xf41a45f5347db0d95bfac48325f8272dce56782574e91083e5025324928bc40c',
    }
}

// test multiple roles for a single tx
export const multiSidedTxMap: Record<string, string[]> = {
    '0xc814cb6b61222beda8a9bcc359e776e72ae732a1c29df572099ecef27c8461e4': [
        '0x96a675775b8546a8602a1015efaacbc87358e478', '0x83eb387c8f7c8903f2be1ca367197fc4b3cb573e'
    ]
}

export function flattenTxHashes() {
    const testTxHashesArr = Object.values(testTxHashes)
    const flattenedTxHashes = testTxHashesArr.reduce((prev: string[], cur) => [...prev, ...Object.values(cur)], [])
    return flattenedTxHashes
}

export default testTxHashes
