/* eslint-disable @typescript-eslint/no-non-null-assertion */
import collect from 'collect.js'
import glob from 'glob'
import {
    Address,
    Chain,
    Decoded,
    Interaction,
    InteractionEvent,
    Interpretation,
    RawTxData,
    Token,
    TokenType,
} from 'interfaces'
import { InterpreterMap, MethodMap } from 'interfaces/contractInterpreter'

function deepCopy(obj: any) {
    return JSON.parse(JSON.stringify(obj))
}

type ContractInterpretersMap = Record<Address, InterpreterMap>

type KeyMapping = {
    key: string
    defaultValue: string
    filters?: {
        event?: string
        to?: string
        from?: string
        value?: string
    } & Record<string, string>
    index?: number
    prefix?: string
    postfix?: string
}

const TopLevelInteractionKeys = ['contractName', 'contractSymbol', 'contractAddress', 'logIndex']
function isTopLevel(key: string) {
    return TopLevelInteractionKeys.includes(key)
}

const getHardcodedContractInterpreters = (): any[] => {
    let files: any[] = []
    glob('**/contractInterpreters/*.json', (err, data) => {
        console.log('ANYthing')
        if (err) {
            console.log('glob error:', err)
        }
        console.log('data', data)
        const unique = data.slice(0, data.length / 2)
        const filesNames = unique.map((item) => './' + item.split('/').slice(-2).join('/'))
        console.log('filesNames', filesNames)
        files = filesNames.map((fileName) => require(fileName)) as any[]
        console.log('files', files[0])
    })
    return files
}

class Interpreter {
    contractSpecificInterpreters: ContractInterpretersMap = {}
    // fallbackInterpreters: Array<Inspector> = []
    userAddress: Address
    chain: Chain

    constructor(
        userAddress: Address,
        // contractInterpreters: ContractInterpretersMap = defaultContractInterpreters,
        chain: Chain,
    ) {
        this.userAddress = userAddress
        this.chain = chain
        const contractInterpreters = getHardcodedContractInterpreters()
        contractInterpreters.forEach((contractInterpreter) => {
            this.contractSpecificInterpreters[contractInterpreter.contractAddress] = contractInterpreter
        })
    }

    public interpret(rawTxDataArr: RawTxData[], decodedDataArr: Decoded[]): Interpretation[] {
        const interpretations: Interpretation[] = []

        for (let i = 0; i < rawTxDataArr.length; i++) {
            const rawTxData = rawTxDataArr[i]
            const decodedData = decodedDataArr[i]

            const interpretation = this.interpretSingleTx(rawTxData, decodedData)
            interpretations.push(interpretation)
        }

        return interpretations
    }

    public interpretSingleTx(rawTxData: RawTxData, decodedData: Decoded): Interpretation {
        const method = decodedData.contractMethod!
        const interactions = decodedData.interactions!

        const toAddress = rawTxData.txReceipt.to
        const fromAddress = rawTxData.txReceipt.from

        // not contract-specific
        const interpretation: Interpretation = {
            nativeTokenValueSent: decodedData.nativeTokenValueSent,
            tokensReceived: this.getTokensReiceived(interactions, this.userAddress),
            tokensSent: this.getTokensSent(interactions, this.userAddress),
            nativeTokenSymbol: this.chain.symbol,
            userName: decodedData.fromENS || fromAddress.substring(0, 6),
        }

        const interpretationMapping = this.contractSpecificInterpreters[toAddress]
        const methodSpecificMapping = interpretationMapping?.writeFunctions[method]

        // contract-specific interpretation
        if (interpretationMapping && methodSpecificMapping) {
            // some of these will be arribtrary keys
            interpretation.contractName = interpretationMapping.contractName
            interpretation.action = methodSpecificMapping.action
            interpretation.exampleDescription = methodSpecificMapping.exampleDescription

            if (decodedData.reverted) {
                interpretation.reverted = true
                // TODO the description and extras should be different for reverted transactions
            }
            interpretation.extra = this.useMethodMapping(
                interactions,
                methodSpecificMapping,
                interpretationMapping.contractAddress,
            )

            interpretation.exampleDescription = this.fillDescriptionTemplate(
                interpretationMapping.writeFunctions[method].exampleDescriptionTemplate,
                interpretation,
            )
        } else {
            // fallback interpretation
        }

        return interpretation
    }

    private findValue(
        interactions: Interaction[],
        keyMapping: KeyMapping,
        userAddress: Address,
        contractAddress: Address,
    ): string {
        const filters = keyMapping.filters || {}
        const index = keyMapping.index || 0

        let filteredInteractions = deepCopy(interactions) as Interaction[]

        // interactions.forEach((interaction) => {
        //     interaction.events.forEach((event) => {
        //         console.log('event', event)
        //     })
        // })

        for (const [key, value] of Object.entries(filters)) {
            let valueToFind = value

            // special case for when we want to match on the contextualized user address
            if (value === '{userAddress}') valueToFind = userAddress
            if (value === '{contractAddress}') valueToFind = contractAddress

            // filter out by events that don't have the keys we want
            for (const interaction of filteredInteractions) {
                if (!isTopLevel(key)) {
                    interaction.events = interaction.events.filter((d) => d[key] === valueToFind)
                }
            }

            // if there aren't any events left, we don't want that interaction
            filteredInteractions = filteredInteractions.filter((i) => i.events.length > 0)

            // filter out interactions by top level key
            if (isTopLevel(key)) {
                filteredInteractions = filteredInteractions.filter((i) => (i as any)[key] === valueToFind)
            }
        }

        const interaction = filteredInteractions[index]
        const prefix = keyMapping.prefix || ''
        const str = (interaction as any)?.[keyMapping.key] || interaction?.events[index]?.[keyMapping.key]
        const postfix = keyMapping.postfix || ''
        const value = str ? prefix + str + postfix : keyMapping.defaultValue

        return value
    }

    private getTokens(interactions: Interaction[], userAddress: Address, direction: 'to' | 'from'): Token[] {
        let tokens: Token[] = []

        let filteredInteractions = deepCopy(interactions) as Interaction[]

        const toKeys = ['to', '_to']
        const fromKeys = ['from', '_from']
        const transferEvents = ['Transfer', 'TransferBatch', 'TransferSingle']

        // filter non-transfer  events only
        for (const interaction of filteredInteractions) {
            interaction.events = interaction.events.filter((d) => transferEvents.includes(d.event))
        }

        // filter out interactions without any of the events we want
        filteredInteractions = filteredInteractions.filter(
            (i) =>
                i.events.filter(
                    (d) =>
                        transferEvents.includes(d.event) && // filters out all non transfer events
                        toOrFromUser(d, direction, userAddress), // filters out event objects that aren't the right direction, and to the user
                ).length > 0, // filters out interactions that don't have any events objects left
        )

        function getTokenType(interaction: Interaction): TokenType {
            const LPTokenSymbols = ['UNI-V2']
            let tokenType = TokenType.DEFAULT

            // LP Token
            if (LPTokenSymbols.includes(interaction.contractSymbol)) {
                tokenType = TokenType.LPToken
                // ERC-1155
            } else if (interaction.events[0]._amount || interaction.events[0]._amounts) {
                tokenType = TokenType.ERC1155
                // ERC-721
            } else if (interaction.events[0].tokenId) {
                tokenType = TokenType.ERC721
                // ERC-20
            } else if (Number(interaction.events[0].value) > 0) {
                tokenType = TokenType.ERC20
            }

            return tokenType
        }

        function toOrFromUser(event: InteractionEvent, direction: 'to' | 'from', userAddress: Address) {
            const directionArr = direction === 'to' ? toKeys : fromKeys
            return directionArr.filter((key) => event[key] === userAddress).length > 0
        }

        // TODO this is only ERC20 tokens
        tokens = filteredInteractions.map((i) => {
            const tokenType = getTokenType(i)

            return {
                type: tokenType,
                name: i.contractName,
                symbol: i.contractSymbol,
                address: i.contractAddress,
                amount: i.events[0].value,
                tokenId: i.events[0].tokenId,
            }
        })

        return tokens
    }

    private getTokensReiceived(interactions: Interaction[], userAddress: Address): Token[] {
        return this.getTokens(interactions, userAddress, 'to')
    }

    private getTokensSent(interactions: Interaction[], userAddress: Address): Token[] {
        return this.getTokens(interactions, userAddress, 'from')
    }

    private useMethodMapping(
        interactions: Interaction[],
        methodSpecificMapping: MethodMap,
        contractAddress: Address,
    ): Record<string, string> {
        const keywordsMap = methodSpecificMapping.keywords
        const keyValueMap: Record<string, string> = {}

        const ignoreKeys = ['action', 'contractName', 'exampleDescription']

        for (const [key, value] of Object.entries(keywordsMap).filter(([key]) => !ignoreKeys.includes(key))) {
            // if the value is a string, we can just use it
            if (typeof value === 'string') {
                keyValueMap[key] = value

                // some data requires searching for it
            } else if (typeof value === 'object') {
                keyValueMap[key] = this.findValue(interactions, value, this.userAddress, contractAddress)
            }
        }

        return keyValueMap
    }

    private fillDescriptionTemplate(template: string, interpretation: Interpretation): string {
        const merged = collect(interpretation.extra).merge(interpretation).all()

        for (const [key, value] of Object.entries(merged)) {
            if (typeof value === 'string') {
                template = template.replace(`{${key}}`, value)
            }
        }
        return template
    }
}

export default Interpreter
