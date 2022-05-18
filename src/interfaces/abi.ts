import { z } from 'zod'

import { boolean, string } from 'interfaces/utils'

const ABI_FunctionOutputZ = z.object({
    name: string,
    internalType: string,
    type: string,
})

const ABI_FunctionInputZ = z.object({
    name: string,
    internalType: string,
    type: string,
    components: z.array(
        z.object({
            name: string,
            type: string,
        }),
    ),
})

const ABI_EventInputZ = ABI_FunctionInputZ.extend({ indexed: boolean })

export type ABI_FunctionOutput = z.infer<typeof ABI_FunctionOutputZ>
export type ABI_FunctionInput = z.infer<typeof ABI_FunctionInputZ>
export type ABI_EventInput = z.infer<typeof ABI_EventInputZ>

export const ABI_Type = z.enum(['function', 'event', 'constructor', 'fallback', 'receive', 'error'])
export const StateMutability = z.enum(['pure', 'view', 'nonpayable', 'payable'])

export type ABIStringMap = {
    constructor: string
    event: string[]
    writeFunction: string[]
    readFunction: string[]
}

const ABI_RowZ = z.object({
    name: string,
    type: ABI_Type,
    hashableSignature: string,
    hexSignature: string,
    fullABI: string,
})

export type ABI_Row = z.infer<typeof ABI_RowZ>

export const ABI_ConstructorZ = z.object({
    type: z.literal(ABI_Type.enum.constructor),
    inputs: z.array(ABI_FunctionInputZ),
    stateMutability: StateMutability,
})

export const ABI_FunctionZ = z.object({
    type: z.literal(ABI_Type.enum.function),
    name: string,
    inputs: z.array(ABI_FunctionInputZ),
    outputs: z.array(ABI_FunctionOutputZ),
    stateMutability: StateMutability.optional(),
})

export const ABI_EventZ = z.object({
    type: z.literal(ABI_Type.enum.event),
    name: string,
    inputs: z.array(ABI_EventInputZ),
    anonymous: boolean,
})
export const ABI_ReceiveZ = z.object({
    type: z.literal(ABI_Type.enum.receive),
    stateMutability: StateMutability,
})
export const ABI_FallbackZ = z.object({
    type: z.literal(ABI_Type.enum.fallback),
    stateMutability: StateMutability,
})

export const ABI_ErrorZ = z.object({
    type: z.literal(ABI_Type.enum.error),
    name: string,
    inputs: z.array(ABI_FunctionInputZ),
})

export const ABI_ItemUnfilteredZ = z.discriminatedUnion('type', [
    ABI_ConstructorZ,
    ABI_FunctionZ,
    ABI_EventZ,
    ABI_ErrorZ,
    ABI_FallbackZ,
    ABI_ReceiveZ,
])

export const ABI_ItemZ = z.discriminatedUnion('type', [ABI_FunctionZ, ABI_EventZ])

export type ABI_Constructor = z.infer<typeof ABI_ConstructorZ>
export type ABI_Function = z.infer<typeof ABI_FunctionZ>
export type ABI_Event = z.infer<typeof ABI_EventZ>
export type ABI_Receive = z.infer<typeof ABI_ReceiveZ>
export type ABI_Fallback = z.infer<typeof ABI_FallbackZ>
export type ABI_Error = z.infer<typeof ABI_ErrorZ>

export type ABI_ItemUnfiltered = z.infer<typeof ABI_ItemUnfilteredZ>
export type ABI_Item = z.infer<typeof ABI_ItemZ>
