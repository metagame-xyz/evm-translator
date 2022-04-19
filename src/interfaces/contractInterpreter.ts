import { Action, Address } from 'interfaces'

export type KeywordMap = {
    key: string
    filters: {
        [key: string]: string
    }
    defaultValue: string
    index?: number
}

export type MethodMap = {
    action: Action
    exampleDescriptionTemplate: string
    exampleDescription: string
    keywords: Record<string, KeywordMap>
}

export type InterpreterMap = {
    contractAddress: Address
    methods: Record<string, string[]>
    contractOfficialName: string
    contractName: string
    writeFunctions: Record<string, MethodMap>
}

export type DeployInterpreterMap = {
    exampleDescriptionTemplate: string
    exampleDescription: string
    keywords: Record<string, KeywordMap>
}

export type ERCMap = {
    contractAddress: null
    contractName: null
    methods: Record<string, string[]>
    contractOfficialName: string
    writeFunctions: Record<string, MethodMap>
}

export type AmbiguousMap = InterpreterMap | ERCMap
