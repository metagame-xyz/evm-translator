[evm-translator](README.md) / Exports

# evm-translator

## Table of contents

### Enumerations

-   [Action](enums/Action.md)
-   [ChainSymbol](enums/ChainSymbol.md)
-   [ContractType](enums/ContractType.md)
-   [TokenType](enums/TokenType.md)
-   [TxType](enums/TxType.md)

### Type aliases

-   [ActivityData](modules.md#activitydata)
-   [Address](modules.md#address)
-   [Chain](modules.md#chain)
-   [Chains](modules.md#chains)
-   [ContractData](modules.md#contractdata)
-   [Decoded](modules.md#decoded)
-   [DecodedCallData](modules.md#decodedcalldata)
-   [EthersAPIKeys](modules.md#ethersapikeys)
-   [InProgressActivity](modules.md#inprogressactivity)
-   [Interaction](modules.md#interaction)
-   [InteractionEvent](modules.md#interactionevent)
-   [InteractionEventParams](modules.md#interactioneventparams)
-   [Interpretation](modules.md#interpretation)
-   [MostTypes](modules.md#mosttypes)
-   [RawDecodedCallData](modules.md#rawdecodedcalldata)
-   [RawDecodedLog](modules.md#rawdecodedlog)
-   [RawDecodedLogEvent](modules.md#rawdecodedlogevent)
-   [RawLogEvent](modules.md#rawlogevent)
-   [RawTxData](modules.md#rawtxdata)
-   [RawTxDataWithoutTrace](modules.md#rawtxdatawithouttrace)
-   [Token](modules.md#token)
-   [TraceLog](modules.md#tracelog)
-   [TraceLogAction](modules.md#tracelogaction)
-   [TxReceipt](modules.md#txreceipt)
-   [TxResponse](modules.md#txresponse)
-   [UnknownKey](modules.md#unknownkey)
-   [UnvalidatedTraceLog](modules.md#unvalidatedtracelog)
-   [UnvalidatedTraceLogAction](modules.md#unvalidatedtracelogaction)

## Type aliases

### ActivityData

Ƭ **ActivityData**: `Object`

#### Type declaration

| Name              | Type                                          |
| :---------------- | :-------------------------------------------- |
| `decodedData`     | [`Decoded`](modules.md#decoded)               |
| `interpretedData` | [`Interpretation`](modules.md#interpretation) |
| `rawTxData`       | [`RawTxData`](modules.md#rawtxdata)           |

#### Defined in

[index.ts:249](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L249)

---

### Address

Ƭ **Address**: \`0x${string}\`

40 char hexadecimal address. Can be an EOA, Contract, or Token address

#### Defined in

[index.ts:10](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L10)

---

### Chain

Ƭ **Chain**: `Object`

#### Type declaration

| Name               | Type                                  | Description                                                                                                  |
| :----------------- | :------------------------------------ | :----------------------------------------------------------------------------------------------------------- |
| `EVM`              | `boolean`                             | If this transaction is from an EVM-compatible chain. This it true for all, currently                         |
| `blockExplorerUrl` | `string`                              | The block explorer URL for this chain. https://etherscan.io/                                                 |
| `daiAddress`       | [`Address`](modules.md#address)       | The singleton contract address for DAI                                                                       |
| `id`               | `number`                              | The chain's id. ETH=1, MATIC=137                                                                             |
| `name`             | `string`                              | The chain's colloquial name. Ethereum, Polygon                                                               |
| `symbol`           | [`ChainSymbol`](enums/ChainSymbol.md) | The chain's symbol. ETH, MATIC                                                                               |
| `testnet`          | `boolean`                             | If this chain is a testnet.                                                                                  |
| `usdcAddress`      | [`Address`](modules.md#address)       | The singleton contract address for USDC                                                                      |
| `usdtAddress`      | [`Address`](modules.md#address)       | The singleton contract address for USDT                                                                      |
| `wethAddress`      | [`Address`](modules.md#address)       | The singleton contract address for the wrapped version of the native token. Need to change the variable name |

#### Defined in

[index.ts:19](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L19)

---

### Chains

Ƭ **Chains**: `Record`<`string`, [`Chain`](modules.md#chain)\>

Map of EVM chain names to an object with Chain metadata

#### Defined in

[index.ts:43](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L43)

---

### ContractData

Ƭ **ContractData**: `Object`

#### Type declaration

| Name                   | Type                                    |
| :--------------------- | :-------------------------------------- |
| `abi`                  | `ABI_ItemUnfiltered`[]                  |
| `address`              | [`Address`](modules.md#address)         |
| `contractName`         | `string` \| `null`                      |
| `contractOfficialName` | `string` \| `null`                      |
| `tokenName`            | `string` \| `null`                      |
| `tokenSymbol`          | `string` \| `null`                      |
| `type`                 | [`ContractType`](enums/ContractType.md) |

#### Defined in

[index.ts:133](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L133)

---

### Decoded

Ƭ **Decoded**: `Object`

#### Type declaration

| Name                      | Type                                                     | Description                                                                   |
| :------------------------ | :------------------------------------------------------- | :---------------------------------------------------------------------------- |
| `chainSymbol`             | `string`                                                 | The symbol for the native token. ex: ETH                                      |
| `contractMethod`          | `string` \| `null`                                       | the name of the function that initiated the transaction. If not decoded, null |
| `contractMethodArguments` | `Record`<`string`, [`MostTypes`](modules.md#mosttypes)\> | -                                                                             |
| `contractName`            | `string` \| `null`                                       | -                                                                             |
| `contractType`            | [`ContractType`](enums/ContractType.md)                  | The type of contract. An ERC-xx, WETH, or                                     |
| `effectiveGasPrice`       | `string` \| `null`                                       | -                                                                             |
| `fromAddress`             | [`Address`](modules.md#address)                          | -                                                                             |
| `fromENS`                 | `string` \| `null`                                       | -                                                                             |
| `gasUsed`                 | `string`                                                 | -                                                                             |
| `interactions`            | [`Interaction`](modules.md#interaction)[]                | -                                                                             |
| `nativeValueSent`         | `string`                                                 | The amount of native token (ex: ETH) sent denominated in wei                  |
| `officialContractName`    | `string` \| `null`                                       | -                                                                             |
| `reverted`                | `boolean`                                                | -                                                                             |
| `timestamp`               | `number` \| `null`                                       | -                                                                             |
| `toAddress`               | [`Address`](modules.md#address) \| `null`                | -                                                                             |
| `toENS`                   | `string` \| `null`                                       | -                                                                             |
| `txHash`                  | `string`                                                 | The transaction's unique hash                                                 |
| `txIndex`                 | `number`                                                 | -                                                                             |
| `txType`                  | [`TxType`](enums/TxType.md)                              | The one of three types the transaction can be. TODO switch to required        |

#### Defined in

[index.ts:153](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L153)

---

### DecodedCallData

Ƭ **DecodedCallData**: `Object`

#### Type declaration

| Name     | Type                                                     |
| :------- | :------------------------------------------------------- |
| `name`   | `string` \| `null`                                       |
| `params` | `Record`<`string`, [`MostTypes`](modules.md#mosttypes)\> |

#### Defined in

[index.ts:336](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L336)

---

### EthersAPIKeys

Ƭ **EthersAPIKeys**: `Object`

#### Type declaration

| Name                          | Type                                                             |
| :---------------------------- | :--------------------------------------------------------------- |
| `alchemy`                     | `string`                                                         |
| `etherscan`                   | `string`                                                         |
| `infura`                      | `string`                                                         |
| `pocket`                      | { `applicationId`: `string` ; `applicationSecretKey`: `string` } |
| `pocket.applicationId`        | `string`                                                         |
| `pocket.applicationSecretKey` | `string`                                                         |

#### Defined in

[index.ts:303](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L303)

---

### InProgressActivity

Ƭ **InProgressActivity**: `Object`

#### Type declaration

| Name         | Type                                |
| :----------- | :---------------------------------- |
| `decoded?`   | [`Decoded`](modules.md#decoded)     |
| `rawTxData?` | [`RawTxData`](modules.md#rawtxdata) |

#### Defined in

[index.ts:121](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L121)

---

### Interaction

Ƭ **Interaction**: `Object`

#### Type declaration

| Name              | Type                                                |
| :---------------- | :-------------------------------------------------- |
| `contractAddress` | [`Address`](modules.md#address)                     |
| `contractName`    | `string` \| `null`                                  |
| `contractSymbol`  | `string` \| `null`                                  |
| `events`          | [`InteractionEvent`](modules.md#interactionevent)[] |

#### Defined in

[index.ts:181](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L181)

---

### InteractionEvent

Ƭ **InteractionEvent**: `Object`

#### Type declaration

| Name              | Type                                                          | Description                              |
| :---------------- | :------------------------------------------------------------ | :--------------------------------------- |
| `eventName`       | `string` \| `null`                                            | The name of the function that was called |
| `logIndex`        | `number` \| `null`                                            | -                                        |
| `nativeTransfer?` | `true`                                                        | -                                        |
| `params`          | [`InteractionEventParams`](modules.md#interactioneventparams) | -                                        |

#### Defined in

[index.ts:188](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L188)

---

### InteractionEventParams

Ƭ **InteractionEventParams**: `Object`

#### Index signature

▪ [key: `string`]: `string` \| `string`[] \| `undefined` \| `null` \| `number` \| `boolean`

#### Type declaration

| Name            | Type               |
| :-------------- | :----------------- |
| `_amount?`      | `string`           |
| `_amounts?`     | `string`[]         |
| `_approved?`    | `string`           |
| `_approvedENS?` | `string`           |
| `_from?`        | `string`           |
| `_fromENS?`     | `string`           |
| `_id?`          | `string` \| `null` |
| `_ids?`         | `string`[]         |
| `_operator?`    | `string`           |
| `_operatorENS?` | `string`           |
| `_owner?`       | `string`           |
| `_ownerENS?`    | `string`           |
| `_to?`          | `string`           |
| `_toENS?`       | `string`           |
| `_tokenId?`     | `string`           |
| `_value?`       | `string`           |
| `from?`         | `string`           |
| `fromENS?`      | `string`           |
| `to?`           | `string`           |
| `toENS?`        | `string`           |
| `tokenId?`      | `string`           |
| `value?`        | `string`           |

#### Defined in

[index.ts:196](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L196)

---

### Interpretation

Ƭ **Interpretation**: `Object`

Each address that was part of a transaction has its own interpretation of the transaction.
native tokens and gas number are denominated in their native token (ex: eth, not wei)

#### Type declaration

| Name                  | Type                                  |
| :-------------------- | :------------------------------------ |
| `action`              | [`Action`](enums/Action.md)           |
| `chainSymbol`         | [`ChainSymbol`](enums/ChainSymbol.md) |
| `contractName`        | `string` \| `null`                    |
| `counterpartyName`    | `string` \| `null`                    |
| `exampleDescription`  | `string`                              |
| `extra`               | `Record`<`string`, `any`\>            |
| `gasPaid`             | `string`                              |
| `nativeValueReceived` | `string`                              |
| `nativeValueSent`     | `string`                              |
| `reverted`            | `true` \| `null`                      |
| `tokensReceived`      | [`Token`](modules.md#token)[]         |
| `tokensSent`          | [`Token`](modules.md#token)[]         |
| `txHash`              | `string`                              |
| `userAddress`         | [`Address`](modules.md#address)       |
| `userName`            | `string`                              |

#### Defined in

[index.ts:230](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L230)

---

### MostTypes

Ƭ **MostTypes**: `string` \| `number` \| `boolean` \| `null` \| `string`[]

#### Defined in

[index.ts:341](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L341)

---

### RawDecodedCallData

Ƭ **RawDecodedCallData**: `Object`

#### Type declaration

| Name     | Type                                                                                                           |
| :------- | :------------------------------------------------------------------------------------------------------------- |
| `name`   | `string` \| `null`                                                                                             |
| `params` | { `name`: `string` ; `type`: `string` ; `value`: `string` \| `number` \| `boolean` \| `null` \| `string`[] }[] |

#### Defined in

[index.ts:327](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L327)

---

### RawDecodedLog

Ƭ **RawDecodedLog**: `Object`

#### Type declaration

| Name       | Type                                                    |
| :--------- | :------------------------------------------------------ |
| `address`  | `string`                                                |
| `decoded`  | `boolean`                                               |
| `events`   | [`RawDecodedLogEvent`](modules.md#rawdecodedlogevent)[] |
| `logIndex` | `number`                                                |
| `name`     | `string` \| `null`                                      |

#### Defined in

[index.ts:319](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L319)

---

### RawDecodedLogEvent

Ƭ **RawDecodedLogEvent**: `Object`

#### Type declaration

| Name    | Type                   |
| :------ | :--------------------- |
| `name`  | `string`               |
| `type`  | `string`               |
| `value` | `string` \| `string`[] |

#### Defined in

[index.ts:313](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L313)

---

### RawLogEvent

Ƭ **RawLogEvent**: `Object`

#### Type declaration

| Name       | Type                            |
| :--------- | :------------------------------ |
| `address`  | [`Address`](modules.md#address) |
| `data`     | `string`                        |
| `logIndex` | `number`                        |
| `topics`   | `string`[]                      |

#### Defined in

[index.ts:126](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L126)

---

### RawTxData

Ƭ **RawTxData**: `Object`

#### Type declaration

| Name         | Type                                  |
| :----------- | :------------------------------------ |
| `txReceipt`  | [`TxReceipt`](modules.md#txreceipt)   |
| `txResponse` | [`TxResponse`](modules.md#txresponse) |
| `txTrace`    | [`TraceLog`](modules.md#tracelog)[]   |

#### Defined in

[index.ts:110](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L110)

---

### RawTxDataWithoutTrace

Ƭ **RawTxDataWithoutTrace**: `Object`

#### Type declaration

| Name         | Type                                  |
| :----------- | :------------------------------------ |
| `txReceipt`  | [`TxReceipt`](modules.md#txreceipt)   |
| `txResponse` | [`TxResponse`](modules.md#txresponse) |

#### Defined in

[index.ts:116](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L116)

---

### Token

Ƭ **Token**: `Object`

#### Type declaration

| Name       | Type                              |
| :--------- | :-------------------------------- |
| `address`  | [`Address`](modules.md#address)   |
| `amount?`  | `string`                          |
| `name`     | `string` \| `null`                |
| `pair?`    | `string`                          |
| `symbol`   | `string` \| `null`                |
| `token0?`  | [`Token`](modules.md#token)       |
| `token1?`  | [`Token`](modules.md#token)       |
| `tokenId?` | `string`                          |
| `type`     | [`TokenType`](enums/TokenType.md) |

#### Defined in

[index.ts:291](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L291)

---

### TraceLog

Ƭ **TraceLog**: `Object`

#### Type declaration

| Name                  | Type                                            |
| :-------------------- | :---------------------------------------------- |
| `action`              | [`TraceLogAction`](modules.md#tracelogaction)   |
| `blockHash`           | `string`                                        |
| `blockNumber`         | `number`                                        |
| `result`              | { `gasUsed`: `BigNumber` ; `output`: `string` } |
| `result.gasUsed`      | `BigNumber`                                     |
| `result.output`       | `string`                                        |
| `subtraces`           | `number`                                        |
| `traceAddress`        | `number`[]                                      |
| `transactionHash`     | `string`                                        |
| `transactionPosition` | `number`                                        |
| `type`                | `string`                                        |

#### Defined in

[index.ts:86](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L86)

---

### TraceLogAction

Ƭ **TraceLogAction**: `Object`

#### Type declaration

| Name       | Type                            |
| :--------- | :------------------------------ |
| `callType` | `string`                        |
| `from`     | [`Address`](modules.md#address) |
| `gas`      | `BigNumber`                     |
| `input`    | `string`                        |
| `to`       | [`Address`](modules.md#address) |
| `value`    | `BigNumber`                     |

#### Defined in

[index.ts:101](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L101)

---

### TxReceipt

Ƭ **TxReceipt**: `Omit`<`unvalidatedTransactionReceipt`, `"from"` \| `"to"`\> & { `from`: [`Address`](modules.md#address) ; `timestamp`: `number` ; `to`: [`Address`](modules.md#address) }

#### Defined in

[index.ts:56](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L56)

---

### TxResponse

Ƭ **TxResponse**: `Omit`<`unvalidatedTransactionResponse`, `"from"` \| `"to"`\> & { `creates`: `string` ; `from`: [`Address`](modules.md#address) }

#### Defined in

[index.ts:55](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L55)

---

### UnknownKey

Ƭ **UnknownKey**: `Omit`<`string`, keyof [`InteractionEvent`](modules.md#interactionevent)\>

#### Defined in

[index.ts:222](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L222)

---

### UnvalidatedTraceLog

Ƭ **UnvalidatedTraceLog**: `Object`

#### Type declaration

| Name                  | Type                                                                |
| :-------------------- | :------------------------------------------------------------------ |
| `action`              | [`UnvalidatedTraceLogAction`](modules.md#unvalidatedtracelogaction) |
| `blockHash`           | `string`                                                            |
| `blockNumber`         | `number`                                                            |
| `result`              | { `gasUsed`: `string` ; `output`: `string` }                        |
| `result.gasUsed`      | `string`                                                            |
| `result.output`       | `string`                                                            |
| `subtraces`           | `number`                                                            |
| `traceAddress`        | `number`[]                                                          |
| `transactionHash`     | `string`                                                            |
| `transactionPosition` | `number`                                                            |
| `type`                | `string`                                                            |

#### Defined in

[index.ts:62](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L62)

---

### UnvalidatedTraceLogAction

Ƭ **UnvalidatedTraceLogAction**: `Object`

#### Type declaration

| Name       | Type                            |
| :--------- | :------------------------------ |
| `callType` | `string`                        |
| `from`     | [`Address`](modules.md#address) |
| `gas`      | `string`                        |
| `input`    | `string`                        |
| `to`       | [`Address`](modules.md#address) |
| `value`    | `string`                        |

#### Defined in

[index.ts:77](https://github.com/polyweave/evm-translator/blob/2d1be25/src/interfaces/index.ts#L77)
