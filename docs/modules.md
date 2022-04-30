[evm-translator](README.md) / Exports

# evm-translator

## Table of contents

### Enumerations

- [ContractType](enums/ContractType.md)
- [TokenType](enums/TokenType.md)
- [TxType](enums/TxType.md)

### Type aliases

- [Action](modules.md#action)
- [ActivityData](modules.md#activitydata)
- [Address](modules.md#address)
- [Chain](modules.md#chain)
- [Chains](modules.md#chains)
- [Decoded](modules.md#decoded)
- [EthersAPIKeys](modules.md#ethersapikeys)
- [InProgressActivity](modules.md#inprogressactivity)
- [Interaction](modules.md#interaction)
- [InteractionEvent](modules.md#interactionevent)
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

### Action

Ƭ **Action**: ``"received"`` \| ``"sent"`` \| ``"minted"`` \| ``"burned"`` \| ``"transferred"`` \| ``"deployed"`` \| ``"executed"`` \| ``"bought"`` \| ``"sold"`` \| ``"swapped"`` \| ``"canceled"`` \| ``"transferred ownership"`` \| ``"received ownership"`` \| ``"added liquidity"`` \| ``"removed liquidity"`` \| ``"claimed"`` \| ``"contributed"`` \| ``"redeemed"`` \| ``"approved"`` \| ``"revoked"`` \| ``"got airdropped"`` \| ``"______TODO______"``

#### Defined in

[index.ts:209](https://github.com/the-metagame/evm-translator/blob/65324cd/src/interfaces/index.ts#L209)

___

### ActivityData

Ƭ **ActivityData**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `decodedData` | [`Decoded`](modules.md#decoded) |
| `interpretedData` | [`Interpretation`](modules.md#interpretation) |
| `rawTxData` | [`RawTxData`](modules.md#rawtxdata) |

#### Defined in

[index.ts:203](https://github.com/the-metagame/evm-translator/blob/65324cd/src/interfaces/index.ts#L203)

___

### Address

Ƭ **Address**: \`0x${string}\`

40 char hexadecimal address. Can be an EOA, Contract, or Token address

#### Defined in

[index.ts:9](https://github.com/the-metagame/evm-translator/blob/65324cd/src/interfaces/index.ts#L9)

___

### Chain

Ƭ **Chain**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `EVM` | `boolean` | If this transaction is from an EVM-compatible chain. This it true for all, currently |
| `blockExplorerUrl` | `string` | The block explorer URL for this chain. https://etherscan.io/ |
| `id` | `number` | The chain's id. ETH=1, MATIC=137 |
| `name` | `string` | The chain's colloquial name. Ethereum, Polygon |
| `symbol` | `string` | The chain's symbol. ETH, MATIC |
| `testnet` | `boolean` | If this chain is a testnet. |
| `wethAddress` | [`Address`](modules.md#address) | The singleton contract address for the wrapped version of the native token. Need to change the variable name |

#### Defined in

[index.ts:13](https://github.com/the-metagame/evm-translator/blob/65324cd/src/interfaces/index.ts#L13)

___

### Chains

Ƭ **Chains**: `Record`<`string`, [`Chain`](modules.md#chain)\>

Map of EVM chain names to an object with Chain metadata

#### Defined in

[index.ts:31](https://github.com/the-metagame/evm-translator/blob/65324cd/src/interfaces/index.ts#L31)

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
| `nativeTokenSymbol` | `string` | - |
| `nativeTokenValueReceived?` | `string` | - |
| `nativeTokenValueSent?` | `string` | - |
| `officialContractName?` | `string` \| ``null`` | - |
| `reverted?` | `boolean` | - |
| `timestamp?` | `string` | - |
| `toAddress?` | [`Address`](modules.md#address) | - |
| `toENS?` | `string` \| ``null`` | - |
| `txHash` | `string` | The transaction's unique hash |
| `txIndex?` | `number` | - |
| `txType?` | [`TxType`](enums/TxType.md) | The one of three types the transaction can be. TODO switch to required |

#### Defined in

[index.ts:121](https://github.com/the-metagame/evm-translator/blob/65324cd/src/interfaces/index.ts#L121)

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

[index.ts:252](https://github.com/the-metagame/evm-translator/blob/65324cd/src/interfaces/index.ts#L252)

___

### InProgressActivity

Ƭ **InProgressActivity**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `decoded?` | [`Decoded`](modules.md#decoded) |
| `rawTxData?` | [`RawTxData`](modules.md#rawtxdata) |

#### Defined in

[index.ts:100](https://github.com/the-metagame/evm-translator/blob/65324cd/src/interfaces/index.ts#L100)

___

### Interaction

Ƭ **Interaction**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `contractAddress` | `string` |
| `contractName` | `string` |
| `contractSymbol` | `string` |
| `events` | [`InteractionEvent`](modules.md#interactionevent)[] |

#### Defined in

[index.ts:147](https://github.com/the-metagame/evm-translator/blob/65324cd/src/interfaces/index.ts#L147)

___

### InteractionEvent

Ƭ **InteractionEvent**: { `_amount?`: `string` ; `_amounts?`: `string`[] ; `_approved?`: `string` ; `_approvedENS?`: `string` ; `_from?`: `string` ; `_fromENS?`: `string` ; `_id?`: `string` ; `_ids?`: `string`[] ; `_operator?`: `string` ; `_operatorENS?`: `string` ; `_owner?`: `string` ; `_ownerENS?`: `string` ; `_to?`: `string` ; `_toENS?`: `string` ; `_tokenId?`: `string` ; `_value?`: `string` ; `event`: `string` ; `from?`: `string` ; `fromENS?`: `string` ; `logIndex`: `number` ; `nativeTokenTransfer?`: ``true`` ; `to?`: `string` ; `toENS?`: `string` ; `tokenId?`: `string` ; `value?`: `string`  } & `Record`<`string`, `string` \| `string`[]\>

#### Defined in

[index.ts:154](https://github.com/the-metagame/evm-translator/blob/65324cd/src/interfaces/index.ts#L154)

___

### Interpretation

Ƭ **Interpretation**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `action?` | [`Action`](modules.md#action) |
| `contractName?` | `string` \| ``null`` |
| `counterpartyName?` | `string` |
| `exampleDescription` | `string` |
| `extra` | `Record`<`string`, `any`\> |
| `gasPaid?` | `string` |
| `nativeTokenSymbol?` | `string` |
| `nativeTokenValueReceived?` | `string` |
| `nativeTokenValueSent?` | `string` |
| `reverted?` | `boolean` |
| `tokensReceived` | [`Token`](modules.md#token)[] |
| `tokensSent` | [`Token`](modules.md#token)[] |
| `userName` | `string` |

#### Defined in

[index.ts:187](https://github.com/the-metagame/evm-translator/blob/65324cd/src/interfaces/index.ts#L187)

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

[index.ts:105](https://github.com/the-metagame/evm-translator/blob/65324cd/src/interfaces/index.ts#L105)

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

[index.ts:94](https://github.com/the-metagame/evm-translator/blob/65324cd/src/interfaces/index.ts#L94)

___

### Token

Ƭ **Token**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `amount?` | `string` |
| `name` | `string` |
| `pair?` | `string` |
| `symbol` | `string` |
| `token0?` | [`Token`](modules.md#token) |
| `token1?` | [`Token`](modules.md#token) |
| `tokenId?` | `string` |
| `type` | [`TokenType`](enums/TokenType.md) |

#### Defined in

[index.ts:240](https://github.com/the-metagame/evm-translator/blob/65324cd/src/interfaces/index.ts#L240)

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

[index.ts:70](https://github.com/the-metagame/evm-translator/blob/65324cd/src/interfaces/index.ts#L70)

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

[index.ts:85](https://github.com/the-metagame/evm-translator/blob/65324cd/src/interfaces/index.ts#L85)

___

### TxReceipt

Ƭ **TxReceipt**: `Omit`<`unvalidatedTransactionReceipt`, ``"from"`` \| ``"to"``\> & { `from`: [`Address`](modules.md#address) ; `to`: [`Address`](modules.md#address)  }

#### Defined in

[index.ts:44](https://github.com/the-metagame/evm-translator/blob/65324cd/src/interfaces/index.ts#L44)

___

### TxResponse

Ƭ **TxResponse**: `Omit`<`unvalidatedTransactionResponse`, ``"from"`` \| ``"to"``\> & { `creates`: `string` ; `from`: [`Address`](modules.md#address)  }

#### Defined in

[index.ts:43](https://github.com/the-metagame/evm-translator/blob/65324cd/src/interfaces/index.ts#L43)

___

### UnknownKey

Ƭ **UnknownKey**: `Omit`<`string`, keyof [`InteractionEvent`](modules.md#interactionevent)\>

#### Defined in

[index.ts:184](https://github.com/the-metagame/evm-translator/blob/65324cd/src/interfaces/index.ts#L184)

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

[index.ts:46](https://github.com/the-metagame/evm-translator/blob/65324cd/src/interfaces/index.ts#L46)

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

[index.ts:61](https://github.com/the-metagame/evm-translator/blob/65324cd/src/interfaces/index.ts#L61)
