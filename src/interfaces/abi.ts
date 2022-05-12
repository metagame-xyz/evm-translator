import { AbiInput, AbiItem } from 'web3-utils'

export type ABIStringMap = {
    constructor: string
    event: string[]
    writeFunction: string[]
    readFunction: string[]
}

export type ABI_Type = 'constructor' | 'event' | 'function' | 'fallback' | 'receive' | 'error'

export type ABI_Row = {
    name: string
    type: ABI_Type
    hashableSignature: string
    fullSignature: string
    hexSignature: string
    fullABI: string
}

export type ABI_ItemUnfiltered = ABI_Function | ABI_Event | ABI_Constructor | ABI_Fallbacks | ABI_Error
export type ABI_Item = ABI_Function | ABI_Event

export type StateMutability = 'pure' | 'view' | 'nonpayable' | 'payable'

export type ABI_Constructor = {
    type: 'constructor'
    inputs: ABI_FunctionInput[]
    stateMutability: StateMutability
}

export type ABI_Function = {
    name: string
    inputs: ABI_FunctionInput[]
    outputs: ABI_FunctionOutput[]
    type: 'function'
    stateMutability: StateMutability
}

export type ABI_Event = {
    type: 'event'
    name: string
    inputs: ABI_EventInput[]
    anonymous: boolean
}

export type ABI_Fallbacks = {
    type: 'receive' | 'fallback'
    stateMutability: StateMutability
}

export type ABI_Error = {
    type: 'error'
    name: string
    inputs: ABI_FunctionInput[]
}

export type ABI_FunctionOutput = {
    name: string
    internalType: string
    type: string
}
export type ABI_FunctionInput = {
    name: string
    internalType: string
    type: string
    components?: {
        name: string
        type: string
    }[]
}
export type ABI_EventInput = {
    name: string
    internalType: string
    type: string
    indexed: boolean
    components?: {
        name: string
        type: string
    }[]
}
