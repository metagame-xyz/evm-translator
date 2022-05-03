[evm-translator](../README.md) / [Exports](../modules.md) / TxType

# Enumeration: TxType

The types of transactions an EOA can initiate

## Table of contents

### Enumeration members

- [CONTRACT\_DEPLOY](TxType.md#contract_deploy)
- [CONTRACT\_INTERACTION](TxType.md#contract_interaction)
- [TRANSFER](TxType.md#transfer)

## Enumeration members

### CONTRACT\_DEPLOY

• **CONTRACT\_DEPLOY** = `"contract deploy"`

A transaction that deploys a new contract from an EOA (TODO: what about create2?)

#### Defined in

[index.ts:44](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L44)

___

### CONTRACT\_INTERACTION

• **CONTRACT\_INTERACTION** = `"contract interaction"`

A transaction that invokes a method on a contract from an EOA

#### Defined in

[index.ts:46](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L46)

___

### TRANSFER

• **TRANSFER** = `"native token transfer"`

A transaction that sends a native token (ex: ETH) from one address to another

#### Defined in

[index.ts:42](https://github.com/the-metagame/evm-translator/blob/4776416/src/interfaces/index.ts#L42)
