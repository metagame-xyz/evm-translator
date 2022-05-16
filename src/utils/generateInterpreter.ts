import Etherscan, { SourceCodeObject } from './clients/Etherscan'
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils'
import { Action } from 'interfaces'
import { ABI_Item, ABI_ItemUnfiltered, ABIStringMap } from 'interfaces/abi'
import { InterpreterMap } from 'interfaces/contractInterpreter'

export default class InterpreterTemplateGenerator {
    etherscan: Etherscan

    constructor(etherscanApiKey: string) {
        this.etherscan = new Etherscan(etherscanApiKey)
    }

    async generateInterpreter(contractAddress: string): Promise<InterpreterMap> {
        let sourceCode: SourceCodeObject
        try {
            sourceCode = await this.etherscan.getSourceCode(contractAddress)
        } catch (e: any) {
            console.error(e)
            throw new Error(`Etherscan API error: ${e.message}`)
        }

        const abiUnfiltered: ABI_ItemUnfiltered[] = JSON.parse(sourceCode.ABI)

        console.log('contract name', sourceCode.ContractName)

        const contractOfficialName = sourceCode.ContractName

        const abi = abiUnfiltered.filter(({ type }) => type === 'function' || type === 'event') as ABI_Item[]

        const interpreterMap: InterpreterMap = {
            contractAddress,
            methods: {},
            contractOfficialName,
            contractName: '______TODO______',
            writeFunctions: {},
        }

        const map = getSignatures(abi) // these include events but we curerently dont need them
        const writeFunctionsArr = getWriteFunctionArr(map.writeFunction)
        const writeFunctionHashSigs = getWriteFunctionHashSigs(map.writeFunction)

        writeFunctionHashSigs.forEach((hash, index) => {
            interpreterMap.methods[hash] = [writeFunctionsArr[index], map.writeFunction[index]]
        })

        writeFunctionsArr.forEach((writeFunction) => {
            interpreterMap.writeFunctions[writeFunction] = {
                action: Action.______TODO______,
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

        return interpreterMap
    }
}

const getWriteFunctionHashSigs = (writeFunctionSigs: string[]): string[] =>
    writeFunctionSigs.map((sig) => keccak256(toUtf8Bytes(sig)).slice(0, 10))
const getWriteFunctionArr = (writeFunctionSigs: string[]): string[] => writeFunctionSigs.map((sig) => sig.split('(')[0])

const getFunctionSignature = (func: ABI_Item): string =>
    func.name + '(' + func.inputs.map((i) => i.type).join(',') + ')'

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
