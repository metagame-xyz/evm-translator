const UniswapV2 = {
    contract_address: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
    methods: {
        // from 4byte.directory
        0x02c8986f: ['pay', 'pay(uint256,address,string,bool)'],
        0x3015a5b5: ['redeem', 'redeem(address,uint256,uint256,uint256,address,bool)'],
    },
    contract_official_name: 'UniswapV2Router02',
    contract_name: 'Uniswap',
    addLiquidityETH: {
        action: 'added liquidity',
        project: {
            key: 'contract_symbol',
            filters: {
                event: 'Transfer',
                from: '{user_address}',
            },
            default_value: 'an unknown',
        },
        example_description_template: `{user_name} added {ether_sent} ETH of liquidity to {project} {contract_name}`,
        example_description: 'brenner.eth added 0.12 ETH of liquididty to the ETH-FWB Liquidity Pool',
    },
    addLiquidity: {
        action: 'added liquidity',
        token_0: {
            key: 'contract_symbol',
            filters: {
                event: 'Transfer',
                from: '{user_address}',
            },
            default_value: 'unknown',
        },
        token_1: {
            key: 'contract_symbol',
            filters: {
                event: 'Transfer',
                from: '{user_address}',
            },
            index: 1, // default is 0
            default_value: 'unknown',
        },
        example_description_template: `{user_name} added liquidity to the {token_0}-{token_1} {contract_name} pool`,
        example_description: 'brenner.eth added 0.12 ETH of liquididty to the ETH-FWB Liquidity Pool',
    },
    removeLiquidityWithPermit: {
        action: 'removed liquidity',
        token_0: {
            key: 'contract_symbol',
            filters: {
                event: 'Transfer',
                to: '{user_address}',
            },
            default_value: 'unknown',
        },
        token_1: {
            key: 'contract_symbol',
            filters: {
                event: 'Transfer',
                to: '{user_address}',
            },
            index: 1, // default is 0
            default_value: 'unknown',
        },
        example_description_template: `{user_name} removed liquidity from the {token_0}-{token_1} {contract_name} pool`,
        example_description: 'brenner.eth removed liquidity to the ETH-FWB Liquidity Pool',
    },
}

export default UniswapV2
