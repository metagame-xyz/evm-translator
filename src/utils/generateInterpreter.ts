import Etherscan from './clients/Etherscan'
import { Address } from 'interfaces'
import { InterpreterMap } from 'interfaces/contractInterpreter'

export default class InterepterTemplateGenerator {
    etherscan: Etherscan

    constructor(etherscanApiKey: string) {
        this.etherscan = new Etherscan(etherscanApiKey)
    }

    async generateInterpreter(contractAddress: Address): Promise<InterpreterMap> {
        const abiString = await this.etherscan.getABI(contractAddress)
        const abiUnfiltered: ABI_ItemUnfiltered[] = JSON.parse(abiString)

        const abi = abiUnfiltered.filter(({ type }) => type === 'function' || type === 'event') as ABI_Item[]

        // console.log(abi)

        const interpreterMap: InterpreterMap = {
            contractAddress,
            methods: {},
            contractOfficialName: '',
            contractName: '______TODO______',
            writeFunctions: {},
        }

        const map = getSignatures(abi) // these include events but we curerently dont need them
        const writeFunctionsArr = getWriteFunctionArr(map)

        writeFunctionsArr.forEach((writeFunction) => {
            interpreterMap.writeFunctions[writeFunction] = {
                action: '______TODO______',
                exampleDescriptionTemplate: '______TODO______',
                exampleDescription: '______TODO______',
                keywords: {
                    __EXAMPLE_KEYWORD__: {
                        key: '______TODO______',
                        filters: {},
                        defaultValue: '______TODO______',
                    },
                },
            }
        })

        console.log('map', writeFunctionsArr)
        // console.log(abi)
        return interpreterMap
    }
}
const getWriteFunctionArr = (map: ABIStringMap): string[] => map.writeFunction.map((sig) => sig.split('(')[0])

const getFunctionSignature = (func: ABI_Item): string => {
    console.log('func:', func, 'inputs:', func.inputs)
    return func.name + '(' + func.inputs.map((i) => i.type).join(',') + ')'
}

const getSignatures = (abi: ABI_Item[]): ABIStringMap => {
    const map: ABIStringMap = {
        constructor: '',
        event: [],
        writeFunction: [],
        readFunction: [],
    }

    const writeStates = ['payable', 'nonpayable']

    for (const item of abi) {
        const sig = getFunctionSignature(item)

        if (item.type === 'function') {
            const functionType = writeStates.includes(item.stateMutability) ? 'writeFunction' : 'readFunction'
            map[functionType].push(sig)
        } else if (item.type === 'event') {
            map[item.type].push(sig)
        }
    }
    return map
}

type ABIStringMap = {
    constructor: string
    event: string[]
    writeFunction: string[]
    readFunction: string[]
}

type ABI_ItemUnfiltered = ABI_Function | ABI_Event | ABI_Constructor | ABI_Fallbacks | ABI_Error
type ABI_Item = ABI_Function | ABI_Event

type StateMutability = 'pure' | 'view' | 'nonpayable' | 'payable'

type ABI_Constructor = {
    type: 'constructor'
    inputs: ABI_FunctionInput[]
    stateMutability: StateMutability
}

type ABI_Function = {
    name: string
    inputs: ABI_FunctionInput[]
    outputs: ABI_FunctionOutput[]
    type: 'function'
    stateMutability: StateMutability
}

type ABI_Event = {
    type: 'event'
    name: string
    inputs: ABI_EventInput[]
    anonymous: boolean
}

type ABI_Fallbacks = {
    type: 'receive' | 'fallback'
    stateMutability: StateMutability
}

type ABI_Error = {
    type: 'error'
    name: string
    inputs: ABI_FunctionInput[]
}

type ABI_FunctionOutput = {
    name: string
    internalType: string
    type: string
}
type ABI_FunctionInput = {
    name: string
    internalType: string
    type: string
}
type ABI_EventInput = {
    name: string
    internalType: string
    type: string
    indexed: boolean
}
