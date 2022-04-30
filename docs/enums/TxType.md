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

[index.ts:38](https://github.com/the-metagame/evm-translator/blob/918e8cb/src/interfaces/index.ts#L38)

___

### CONTRACT\_INTERACTION

• **CONTRACT\_INTERACTION** = `"contract interaction"`

A transaction that invokes a method on a contract from an EOA

#### Defined in

[index.ts:40](https://github.com/the-metagame/evm-translator/blob/918e8cb/src/interfaces/index.ts#L40)

___

### TRANSFER

• **TRANSFER** = `"native token transfer"`

A transaction that sends a native token (ex: ETH) from one address to another

#### Defined in

[index.ts:36](https://github.com/the-metagame/evm-translator/blob/918e8cb/src/interfaces/index.ts#L36)
