[evm-translator](README.md) / Exports

# evm-translator

## Table of contents

### Enumerations

- [Action](enums/Action.md)
- [ContractType](enums/ContractType.md)
- [TokenType](enums/TokenType.md)
- [TxType](enums/TxType.md)

### Type aliases

- [ActivityData](modules.md#activitydata)
- [Address](modules.md#address)
- [Chain](modules.md#chain)
- [Chains](modules.md#chains)
- [Decoded](modules.md#decoded)
- [EthersAPIKeys](modules.md#ethersapikeys)
- [InProgressActivity](modules.md#inprogressactivity)
- [Interaction](modules.md#interaction)
- [InteractionEvent](modules.md#interactionevent)
- [InteractionEventParams](modules.md#interactioneventparams)
- [Interpretation](modules.md#interpretation)
- [RawLogEvent](modules.md#rawlogevent)
- [RawTxData](modules.md#rawtxdata)
- [Token](modules.md#token)
- [TraceLog](modules.md#tracelog)
- [TraceLogAction](modules.md#tracelogaction)
- [TxReceipt](modules.md#txreceipt)
- [TxResponse](modules.md#txresponse)
- [UnknownKey](modules.md#unknownkey)
- [UnvalidatedTraceLog](modules.md#unvalidatedtracelog)
- [UnvalidatedTraceLogAction](modules.md#unvalidatedtracelogaction)

## Type aliases

### ActivityData

Ƭ **ActivityData**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `decodedData` | [`Decoded`](modules.md#decoded) |
| `interpretedData` | [`Interpretation`](modules.md#interpretation) |
| `rawTxData` | [`RawTxData`](modules.md#rawtxdata) |

#### Defined in

[index.ts:221](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L221)

___

### Address

Ƭ **Address**: \`0x${string}\`

40 char hexadecimal address. Can be an EOA, Contract, or Token address

#### Defined in

[index.ts:9](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L9)

___

### Chain

Ƭ **Chain**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `EVM` | `boolean` | If this transaction is from an EVM-compatible chain. This it true for all, currently |
| `blockExplorerUrl` | `string` | The block explorer URL for this chain. https://etherscan.io/ |
| `daiAddress` | [`Address`](modules.md#address) | The singleton contract address for DAI |
| `id` | `number` | The chain's id. ETH=1, MATIC=137 |
| `name` | `string` | The chain's colloquial name. Ethereum, Polygon |
| `symbol` | `string` | The chain's symbol. ETH, MATIC |
| `testnet` | `boolean` | If this chain is a testnet. |
| `usdcAddress` | [`Address`](modules.md#address) | The singleton contract address for USDC |
| `usdtAddress` | [`Address`](modules.md#address) | The singleton contract address for USDT |
| `wethAddress` | [`Address`](modules.md#address) | The singleton contract address for the wrapped version of the native token. Need to change the variable name |

#### Defined in

[index.ts:13](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L13)

___

### Chains

Ƭ **Chains**: `Record`<`string`, [`Chain`](modules.md#chain)\>

Map of EVM chain names to an object with Chain metadata

#### Defined in

[index.ts:37](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L37)

___

### Decoded

Ƭ **Decoded**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `contractMethod?` | `string` \| ``null`` | the name of the function that initiated the transaction. If not decoded, null |
| `contractName?` | `string` | - |
| `contractType` | [`ContractType`](enums/ContractType.md) | The type of contract. An ERC-xx, WETH, or |
| `effectiveGasPrice?` | `string` | - |
| `fromAddress` | [`Address`](modules.md#address) | - |
| `fromENS?` | `string` \| ``null`` | - |
| `gasUsed?` | `string` | - |
| `interactions` | [`Interaction`](modules.md#interaction)[] | - |
| `nativeTokenSymbol` | `string` | The symbol for the native token. ex: ETH |
| `nativeTokenValueSent` | `string` | The amount of native token (ex: ETH) sent denominated in wei |
| `officialContractName?` | `string` \| ``null`` | - |
| `reverted?` | `boolean` | - |
| `timestamp?` | `string` | - |
| `toAddress?` | [`Address`](modules.md#address) | - |
| `toENS?` | `string` \| ``null`` | - |
| `txHash` | `string` | The transaction's unique hash |
| `txIndex?` | `number` | - |
| `txType` | [`TxType`](enums/TxType.md) | The one of three types the transaction can be. TODO switch to required |

#### Defined in

[index.ts:127](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L127)

___

### EthersAPIKeys

Ƭ **EthersAPIKeys**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `alchemy` | `string` |
| `etherscan` | `string` |
| `infura` | `string` |
| `pocket` | { `applicationId`: `string` ; `applicationSecretKey`: `string`  } |
| `pocket.applicationId` | `string` |
| `pocket.applicationSecretKey` | `string` |

#### Defined in

[index.ts:273](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L273)

___

### InProgressActivity

Ƭ **InProgressActivity**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `decoded?` | [`Decoded`](modules.md#decoded) |
| `rawTxData?` | [`RawTxData`](modules.md#rawtxdata) |

#### Defined in

[index.ts:106](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L106)

___

### Interaction

Ƭ **Interaction**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `contractAddress` | [`Address`](modules.md#address) |
| `contractName` | `string` \| ``null`` |
| `contractSymbol` | `string` \| ``null`` |
| `events` | [`InteractionEvent`](modules.md#interactionevent)[] |

#### Defined in

[index.ts:154](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L154)

___

### InteractionEvent

Ƭ **InteractionEvent**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` | The name of the function that was called |
| `logIndex` | `number` | - |
| `nativeTokenTransfer?` | ``true`` | - |
| `params` | [`InteractionEventParams`](modules.md#interactioneventparams) | - |

#### Defined in

[index.ts:161](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L161)

___

### InteractionEventParams

Ƭ **InteractionEventParams**: `Object`

#### Index signature

▪ [key: `string`]: `string` \| `string`[] \| `undefined` \| ``null`` \| `number` \| `boolean`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `_amount?` | `string` |
| `_amounts?` | `string`[] |
| `_approved?` | `string` |
| `_approvedENS?` | `string` |
| `_from?` | `string` |
| `_fromENS?` | `string` |
| `_id?` | `string` \| ``null`` |
| `_ids?` | `string`[] |
| `_operator?` | `string` |
| `_operatorENS?` | `string` |
| `_owner?` | `string` |
| `_ownerENS?` | `string` |
| `_to?` | `string` |
| `_toENS?` | `string` |
| `_tokenId?` | `string` |
| `_value?` | `string` |
| `from?` | `string` |
| `fromENS?` | `string` |
| `to?` | `string` |
| `toENS?` | `string` |
| `tokenId?` | `string` |
| `value?` | `string` |

#### Defined in

[index.ts:169](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L169)

___

### Interpretation

Ƭ **Interpretation**: `Object`

Each address that was part of a transaction has its own interpretation of the transaction.
native tokens and gas number are denominated in their native token (ex: eth, not wei)

#### Type declaration

| Name | Type |
| :------ | :------ |
| `action?` | [`Action`](enums/Action.md) |
| `contractName?` | `string` \| ``null`` |
| `counterpartyName?` | `string` |
| `exampleDescription` | `string` |
| `extra` | `Record`<`string`, `any`\> |
| `gasPaid` | `string` |
| `nativeTokenSymbol` | `string` |
| `nativeTokenValueReceived` | `string` |
| `nativeTokenValueSent` | `string` |
| `reverted` | `boolean` |
| `tokensReceived` | [`Token`](modules.md#token)[] |
| `tokensSent` | [`Token`](modules.md#token)[] |
| `txHash` | `string` |
| `userAddress` | [`Address`](modules.md#address) |
| `userName` | `string` |

#### Defined in

[index.ts:203](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L203)

___

### RawLogEvent

Ƭ **RawLogEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `address` | [`Address`](modules.md#address) |
| `data` | `string` |
| `logIndex` | `number` |
| `topics` | `string`[] |

#### Defined in

[index.ts:111](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L111)

___

### RawTxData

Ƭ **RawTxData**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `txReceipt` | [`TxReceipt`](modules.md#txreceipt) |
| `txResponse` | [`TxResponse`](modules.md#txresponse) |
| `txTrace` | [`TraceLog`](modules.md#tracelog)[] |

#### Defined in

[index.ts:100](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L100)

___

### Token

Ƭ **Token**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `address` | [`Address`](modules.md#address) |
| `amount?` | `string` |
| `name` | `string` \| ``null`` |
| `pair?` | `string` |
| `symbol` | `string` \| ``null`` |
| `token0?` | [`Token`](modules.md#token) |
| `token1?` | [`Token`](modules.md#token) |
| `tokenId?` | `string` |
| `type` | [`TokenType`](enums/TokenType.md) |

#### Defined in

[index.ts:261](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L261)

___

### TraceLog

Ƭ **TraceLog**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `action` | [`TraceLogAction`](modules.md#tracelogaction) |
| `blockHash` | `string` |
| `blockNumber` | `number` |
| `result` | { `gasUsed`: `BigNumber` ; `output`: `string`  } |
| `result.gasUsed` | `BigNumber` |
| `result.output` | `string` |
| `subtraces` | `number` |
| `traceAddress` | `number`[] |
| `transactionHash` | `string` |
| `transactionPosition` | `number` |
| `type` | `string` |

#### Defined in

[index.ts:76](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L76)

___

### TraceLogAction

Ƭ **TraceLogAction**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `callType` | `string` |
| `from` | [`Address`](modules.md#address) |
| `gas` | `BigNumber` |
| `input` | `string` |
| `to` | [`Address`](modules.md#address) |
| `value` | `BigNumber` |

#### Defined in

[index.ts:91](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L91)

___

### TxReceipt

Ƭ **TxReceipt**: `Omit`<`unvalidatedTransactionReceipt`, ``"from"`` \| ``"to"``\> & { `from`: [`Address`](modules.md#address) ; `to`: [`Address`](modules.md#address)  }

#### Defined in

[index.ts:50](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L50)

___

### TxResponse

Ƭ **TxResponse**: `Omit`<`unvalidatedTransactionResponse`, ``"from"`` \| ``"to"``\> & { `creates`: `string` ; `from`: [`Address`](modules.md#address)  }

#### Defined in

[index.ts:49](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L49)

___

### UnknownKey

Ƭ **UnknownKey**: `Omit`<`string`, keyof [`InteractionEvent`](modules.md#interactionevent)\>

#### Defined in

[index.ts:195](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L195)

___

### UnvalidatedTraceLog

Ƭ **UnvalidatedTraceLog**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `action` | [`UnvalidatedTraceLogAction`](modules.md#unvalidatedtracelogaction) |
| `blockHash` | `string` |
| `blockNumber` | `number` |
| `result` | { `gasUsed`: `string` ; `output`: `string`  } |
| `result.gasUsed` | `string` |
| `result.output` | `string` |
| `subtraces` | `number` |
| `traceAddress` | `number`[] |
| `transactionHash` | `string` |
| `transactionPosition` | `number` |
| `type` | `string` |

#### Defined in

[index.ts:52](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L52)

___

### UnvalidatedTraceLogAction

Ƭ **UnvalidatedTraceLogAction**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `callType` | `string` |
| `from` | [`Address`](modules.md#address) |
| `gas` | `string` |
| `input` | `string` |
| `to` | [`Address`](modules.md#address) |
| `value` | `string` |

#### Defined in

[index.ts:67](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L67)
