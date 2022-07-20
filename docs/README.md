evm-translator / [Exports](modules.md)

[![GitHub license](https://img.shields.io/github/license/the-metagame/evm-translator)](https://github.com/the-metagame/evm-translator/blob/main/LICENSE)

# evm-translator

a library for making EVM-based blockchain data more human-readable

If a transaction interacts with 5 addresses, there will be 5 different interpretations, each from the perspective of each address. When interpreting a transaction, if an address is not provided, the interpretation will default to using the `from` address of the transaction.

## Logical Layout

-   Raw data fetcher
-   Decoder
-   Interpreter
    -   Contract-specific interpreters
    -   Generic Interpreters
        -   transfers
        -   tokens
        -   fallback

## Contractor-specific Interpreter Maps

The long-term vision is that every contract creator (or their community) writes one of these JSON maps for their contract and adds the IPFS/Arweave/API URL to the JSON in their contract as a read function that we can query and index.

The mid-term vision is we store these maps in a openly accessible database. When we interpret a transaction, we query the DB.

The current state is that we have a folder of JSON files in the repo.

An example of an Interpreter Map

```json
{
    "contractAddress": "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
    "contractOfficialName": "UniswapV2Router02",
    "contractName": "Uniswap V2",
    "writeFunctions": {
        "addLiquidity": {
            "action": "added liquidity",
            "keywords": {
                "token_0": {
                    "key": "contractSymbol",
                    "filters": {
                        "eventName": "Transfer",
                        "from": "{userAddress}"
                    },
                    "defaultValue": "unknown"
                },
                "token_1": {
                    "key": "contractSymbol",
                    "filters": {
                        "eventName": "Transfer",
                        "from": "{userAddress}"
                    },
                    "index": 1,
                    "defaultValue": "unknown"
                }
            },
            "exampleDescriptionTemplate": "{userName} added liquidity to the {token_0}-{token_1} {contractName} pool",
            "exampleDescription": "0xf1a9 added liquidity to the SUPER-WETH Uniswap V2 pool"
        },
        "addLiquidityETH": {
            "action": "added liquidity",
            "keywords": {
                "token_0": {
                    "key": "contractSymbol",
                    "filters": {
                        "eventName": "Transfer",
                        "from": "{userAddress}"
                    },
                    "defaultValue": "unknown"
                }
            },
            "exampleDescriptionTemplate": "{userName} {action} to the {token_0}-{chainSymbol} {contractName} pool",
            "exampleDescription": "0xf1a9 added liquidity to the ACYC-ETH Uniswap V2 pool"
        }
    }
}
```

This is an example of the decoded event logs when the `addLiquidity` function gets called.

```json
{
    "txHash": "0x0e6388e80a6023cfc8e7b9fb2ff94e3bf5d34cdc8bb348d124e2385e29d5bcf8",
    "txType": "contract interaction",
    "nativeValueSent": "0",
    "chainSymbol": "ETH",
    "txIndex": 191,
    "reverted": false,
    "gasUsed": "142824",
    "effectiveGasPrice": "176081789506",
    "fromAddress": "0xf1a935a3588d20994e02848c93b107000a60110d",
    "toAddress": "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
    "interactions": [
        {
            "contractName": "Uniswap V2",
            "contractSymbol": "UNI-V2",
            "contractAddress": "0x25647e01bd0967c1b9599fa3521939871d1d0888",
            "events": [
                {
                    "eventName": "Mint",
                    "logIndex": 300,
                    "params": {
                        "sender": "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
                        "amount0": "1373338329117707188",
                        "amount1": "3432476292290743708413"
                    }
                },
                {
                    "eventName": "Sync",
                    "logIndex": 299,
                    "params": {
                        "reserve0": "4747953991459041932832",
                        "reserve1": "11866878806943684115024747"
                    }
                },
                {
                    "eventName": "Transfer",
                    "logIndex": 298,
                    "params": {
                        "from": "0x0000000000000000000000000000000000000000",
                        "to": "0xf1a935a3588d20994e02848c93b107000a60110d",
                        "value": "40.512792305770100502"
                    }
                }
            ]
        },
        {
            "contractName": "SuperFarm",
            "contractSymbol": "SUPER",
            "contractAddress": "0xe53ec727dbdeb9e2d5456c3be40cff031ab40a55",
            "events": [
                {
                    "eventName": "Approval",
                    "logIndex": 297,
                    "params": {
                        "owner": "0xf1a935a3588d20994e02848c93b107000a60110d",
                        "spender": "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
                        "value": "115792089237316195423570985008687907853269984665640564036025.107715622385931522"
                    }
                },
                {
                    "eventName": "Transfer",
                    "logIndex": 296,
                    "params": {
                        "from": "0xf1a935a3588d20994e02848c93b107000a60110d",
                        "to": "0x25647e01bd0967c1b9599fa3521939871d1d0888",
                        "value": "3432.476292290743708413"
                    }
                }
            ]
        },
        {
            "contractName": "Wrapped Ether",
            "contractSymbol": "WETH",
            "contractAddress": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
            "events": [
                {
                    "eventName": "Transfer",
                    "logIndex": 295,
                    "params": {
                        "from": "0xf1a935a3588d20994e02848c93b107000a60110d",
                        "to": "0x25647e01bd0967c1b9599fa3521939871d1d0888",
                        "value": "1.373338329117707188"
                    }
                }
            ]
        }
    ],
    "contractType": "OTHER",
    "contractMethod": "addLiquidity",
    "timestamp": "2021-12-01T00:06:38Z",
    "officialContractName": "UniswapV2Router02"
}
```

When the above map is applied to above decoded event logs, this is the interpretation that it will generate.

```json
{
    "txHash": "0x0e6388e80a6023cfc8e7b9fb2ff94e3bf5d34cdc8bb348d124e2385e29d5bcf8",
    "userAddress": "0xf1a935a3588d20994e02848c93b107000a60110d",
    "userName": "0xf1a9",
    "contractName": "Uniswap V2",
    "contractOfficialName": "UniswapV2Router02",
    "action": "added liquidity",
    "exampleDescription": "0xf1a9 added liquidity to the SUPER-WETH Uniswap V2 pool",
    "nativeValueSent": "0",
    "nativeValueReceived": "0",
    "chainSymbol": "ETH",
    "tokensReceived": [
        {
            "type": "LPToken",
            "name": "Uniswap V2",
            "symbol": "UNI-V2",
            "address": "0x25647e01bd0967c1b9599fa3521939871d1d0888",
            "amount": "40.512792305770100502"
        }
    ],
    "tokensSent": [
        {
            "type": "ERC20",
            "name": "SuperFarm",
            "symbol": "SUPER",
            "address": "0xe53ec727dbdeb9e2d5456c3be40cff031ab40a55",
            "amount": "3432.476292290743708413"
        },
        {
            "type": "ERC20",
            "name": "Wrapped Ether",
            "symbol": "WETH",
            "address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
            "amount": "1.373338329117707188"
        }
    ],
    "gasPaid": "0.025148705504404944",
    "extra": {
        "token_0": "SUPER",
        "token_1": "WETH"
    }
}
```

The Interpreter Map supplies `contractName`, `action`, `extra`, and a more specific `exampleDescription`.

All other values come from generic interpretations.
