import Etherscan, { SourceCodeObject } from './clients/Etherscan'

import { Action } from 'interfaces'
import { ABI_Item, ABI_ItemUnfiltered, ABI_Type, writeStates } from 'interfaces/abi'
import { InterpreterMap } from 'interfaces/contractInterpreter'

import { abiToAbiRow } from 'utils'

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

        const ABIs = abiUnfiltered.filter(({ type }) => type === 'function' || type === 'event') as ABI_Item[]

        const abiRows = ABIs.map((abi) => abiToAbiRow(abi))

        const writeFunctions = abiRows.filter(
            (abiRow) =>
                abiRow.type === ABI_Type.enum.function && writeStates.includes(abiRow.abiJSON.stateMutability || ''),
        )

        const interpreterMap: InterpreterMap = {
            contractAddress,
            methods: {},
            contractOfficialName,
            contractName: '______TODO______',
            writeFunctions: {},
        }

        writeFunctions.forEach((abi) => {
            interpreterMap.methods[abi.hashedSignature] = abi.hashableSignature
            interpreterMap.writeFunctions[abi.name] = {
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
