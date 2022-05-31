import { z } from 'zod'

import { boolean, string } from 'interfaces/utils'

const ABI_FunctionOutputZ = z.object({
    name: string.optional(),
    type: string,
    components: z.array(z.any()).optional(),
})

const ABI_FunctionInputZ = z.object({
    name: string.optional(),
    type: string,
    components: z.array(z.any()).optional(),
})

const ABI_EventInputZ = ABI_FunctionInputZ.extend({ indexed: boolean })

export type ABI_FunctionOutput = z.infer<typeof ABI_FunctionOutputZ>
export type ABI_FunctionInput = z.infer<typeof ABI_FunctionInputZ>
export type ABI_EventInput = z.infer<typeof ABI_EventInputZ>

export const ABI_Type = z.enum(['function', 'event', 'constructor', 'fallback', 'receive', 'error'])
export const StateMutability = z.enum(['pure', 'view', 'nonpayable', 'payable'])
export const writeStates = [StateMutability.enum.payable, StateMutability.enum.nonpayable]

export const ABI_ConstructorZ = z.object({
    type: z.literal(ABI_Type.enum.constructor),
    inputs: z.array(ABI_FunctionInputZ),
    stateMutability: StateMutability.optional(),
})

export const ABI_FunctionZ = z.object({
    type: z.literal(ABI_Type.enum.function),
    name: string,
    inputs: z.array(ABI_FunctionInputZ),
    outputs: z.array(ABI_FunctionOutputZ),
    stateMutability: StateMutability.optional(),
    constant: boolean.optional(),
    payable: boolean.optional(),
})

export const ABI_EventZ = z.object({
    type: z.literal(ABI_Type.enum.event),
    name: string,
    inputs: z.array(ABI_EventInputZ),
    anonymous: boolean,
})
export const ABI_ReceiveZ = z.object({
    type: z.literal(ABI_Type.enum.receive),
    stateMutability: StateMutability.optional(),
    constant: boolean.optional(),
    payable: boolean.optional(),
})
export const ABI_FallbackZ = z.object({
    type: z.literal(ABI_Type.enum.fallback),
    stateMutability: StateMutability.optional(),
    constant: boolean.optional(),
    payable: boolean.optional(),
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

export const ABI_RowConstructorZ = z.object({
    name: string,
    type: z.literal(ABI_Type.enum.constructor),
    hashableSignature: string,
    hashedSignature: string,
    fullSignature: string,
    abiJSON: ABI_ConstructorZ,
    default: boolean.optional(),
})
export const ABI_RowFunctionZ = z.object({
    name: string,
    type: z.literal(ABI_Type.enum.function),
    hashableSignature: string,
    hashedSignature: string,
    fullSignature: string,
    abiJSON: ABI_FunctionZ,
    default: boolean.optional(),
})
export const ABI_RowEventZ = z.object({
    name: string,
    type: z.literal(ABI_Type.enum.event),
    hashableSignature: string,
    hashedSignature: string,
    fullSignature: string,
    abiJSON: ABI_EventZ,
    default: boolean.optional(),
})

export const ABI_RowReceiveZ = z.object({
    name: string,
    type: z.literal(ABI_Type.enum.receive),
    hashableSignature: string,
    hashedSignature: string,
    fullSignature: string,
    abiJSON: ABI_ReceiveZ,
    default: boolean.optional(),
})
export const ABI_RowFallbackZ = z.object({
    name: string,
    type: z.literal(ABI_Type.enum.fallback),
    hashableSignature: string,
    hashedSignature: string,
    fullSignature: string,
    abiJSON: ABI_FallbackZ,
    default: boolean.optional(),
})
export const ABI_RowErrorZ = z.object({
    name: string,
    type: z.literal(ABI_Type.enum.error),
    hashableSignature: string,
    hashedSignature: string,
    fullSignature: string,
    abiJSON: ABI_ErrorZ,
    default: boolean.optional(),
})

export const ABI_RowZ = z.discriminatedUnion('type', [
    ABI_RowConstructorZ,
    ABI_RowEventZ,
    ABI_RowFunctionZ,
    ABI_RowReceiveZ,
    ABI_RowFallbackZ,
    ABI_RowErrorZ,
])

export type ABI_Row = z.infer<typeof ABI_RowZ>

export type ABI_Constructor = z.infer<typeof ABI_ConstructorZ>
export type ABI_Function = z.infer<typeof ABI_FunctionZ>
export type ABI_Event = z.infer<typeof ABI_EventZ>
export type ABI_Receive = z.infer<typeof ABI_ReceiveZ>
export type ABI_Fallback = z.infer<typeof ABI_FallbackZ>
export type ABI_Error = z.infer<typeof ABI_ErrorZ>

export type ABI_ItemUnfiltered = z.infer<typeof ABI_ItemUnfilteredZ>
export type ABI_Item = z.infer<typeof ABI_ItemZ>
