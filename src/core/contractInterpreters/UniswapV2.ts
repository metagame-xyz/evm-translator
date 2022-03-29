const UniswapV2 = {
    contract_address: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
    methods: {
        // from 4byte.directory
        0x02c8986f: ['pay', 'pay(uint256,address,string,bool)'],
        0x3015a5b5: ['redeem', 'redeem(address,uint256,uint256,uint256,address,bool)'],
    },
    contract_official_name: 'UniswapV2Router02',
    contractName: 'Uniswap',
    addLiquidityETH: {
        action: 'added liquidity',
        project: {
            key: 'contract_symbol',
            filters: {
                event: 'Transfer',
                from: '{userAddress}',
            },
            defaultValue: 'an unknown',
        },
        exampleDescriptionTemplate: `{userName} added {nativeTokenValueSent} ETH of liquidity to {project} {contractName}`,
        exampleDescription: 'brenner.eth added 0.12 ETH of liquididty to the ETH-FWB Liquidity Pool',
    },
    addLiquidity: {
        action: 'added liquidity',
        token_0: {
            key: 'contract_symbol',
            filters: {
                event: 'Transfer',
                from: '{userAddress}',
            },
            defaultValue: 'unknown',
        },
        token_1: {
            key: 'contract_symbol',
            filters: {
                event: 'Transfer',
                from: '{userAddress}',
            },
            index: 1, // default is 0
            defaultValue: 'unknown',
        },
        exampleDescriptionTemplate: `{userName} added liquidity to the {token_0}-{token_1} {contractName} pool`,
        exampleDescription: 'brenner.eth added 0.12 ETH of liquididty to the ETH-FWB Liquidity Pool',
    },
    removeLiquidityWithPermit: {
        action: 'removed liquidity',
        token_0: {
            key: 'contract_symbol',
            filters: {
                event: 'Transfer',
                to: '{userAddress}',
            },
            defaultValue: 'unknown',
        },
        token_1: {
            key: 'contract_symbol',
            filters: {
                event: 'Transfer',
                to: '{userAddress}',
            },
            index: 1, // default is 0
            defaultValue: 'unknown',
        },
        exampleDescriptionTemplate: `{userName} removed liquidity from the {token_0}-{token_1} {contractName} pool`,
        exampleDescription: 'brenner.eth removed liquidity to the ETH-FWB Liquidity Pool',
    },
}

export default UniswapV2
