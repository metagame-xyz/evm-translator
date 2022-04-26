/* eslint-disable @typescript-eslint/no-non-null-assertion */
import contractInterpreters from './contractInterpreters'
import contractDeployInterpreter from './genericInterpreters/ContractDeploy.json'
import lastFallback from './genericInterpreters/lastFallback'
import interpretGenericToken from './genericInterpreters/token'
import interpretGenericTransfer from './genericInterpreters/transfer'
import { BigNumber } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import {
    Address,
    Chain,
    ContractType,
    Decoded,
    Interaction,
    InteractionEvent,
    Interpretation,
    RawTxData,
    Token,
    TokenType,
    TX_TYPE,
} from 'interfaces'
import { InterpreterMap } from 'interfaces/contractInterpreter'
import { fillDescriptionTemplate, shortenNamesInString } from 'utils'

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
    array?: boolean
}

const TopLevelInteractionKeys = ['contractName', 'contractSymbol', 'contractAddress', 'logIndex']
function isTopLevel(key: string) {
    return TopLevelInteractionKeys.includes(key)
}

class Interpreter {
    contractSpecificInterpreters: ContractInterpretersMap = {}
    // fallbackInterpreters: Array<Inspector> = []
    userAddress: Address
    chain: Chain

    constructor(userAddress: Address, chain: Chain) {
        this.userAddress = userAddress
        this.chain = chain

        for (const [address, map] of Object.entries(contractInterpreters)) {
            this.contractSpecificInterpreters[address as Address] = map as InterpreterMap
        }
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

        const gasUsed = formatEther(
            BigNumber.from(decodedData.gasUsed).mul(BigNumber.from(decodedData.effectiveGasPrice)),
        )

        let userName = this.userAddress.substring(0, 6)

        if (fromAddress === this.userAddress) {
            userName = decodedData.fromENS || userName
        }
        if (toAddress === this.userAddress) {
            userName = decodedData.toENS || userName
        }

        // TODO generalize this so it'll get any ENS (ex: _operatorENS)

        // not contract-specific
        const interpretation: Interpretation = {
            nativeTokenValueSent: decodedData.nativeTokenValueSent,
            tokensReceived: this.getTokensReceived(interactions, this.userAddress),
            tokensSent: this.getTokensSent(interactions, this.userAddress),
            nativeTokenSymbol: this.chain.symbol,
            userName,
            gasPaid: gasUsed,
            extra: {},
            exampleDescription: 'no example description defined',
        }

        if (decodedData.reverted) {
            interpretation.reverted = true
            interpretation.exampleDescription = 'transaction reverted'
            return interpretation
            // TODO the description and extras should be different for reverted transactions
        }

        const interpretationMapping = this.contractSpecificInterpreters[toAddress]
        const methodSpecificMapping = interpretationMapping?.writeFunctions[method]

        // if there's no contract-specific mapping, try to use the fallback mapping

        if (decodedData.txType === TX_TYPE.CONTRACT_DEPLOY) {
            interpretation.action = 'deployed'
            interpretation.exampleDescription = contractDeployInterpreter.exampleDescription

            interpretation.extra = {
                ...interpretation.extra,
                ...this.useKeywordMap(interactions, contractDeployInterpreter.keywords, '0x_DOESNT_EXIST'),
            }

            interpretation.exampleDescription = fillDescriptionTemplate(
                contractDeployInterpreter.exampleDescriptionTemplate,
                interpretation,
            )
        } else if (decodedData.txType === TX_TYPE.TRANSFER) {
            interpretGenericTransfer(decodedData, interpretation, this.userAddress)
            // contract-specific interpretation
        } else if (interpretationMapping && methodSpecificMapping) {
            console.log('contract-specific interpretation', interpretationMapping.contractName, method)
            // some of these will be arbitrary keys
            interpretation.contractName = interpretationMapping.contractName
            interpretation.action = methodSpecificMapping.action
            interpretation.exampleDescription = methodSpecificMapping.exampleDescription

            if (decodedData.reverted) {
                interpretation.reverted = true
                // TODO the description and extras should be different for reverted transactions
            }
            interpretation.extra = this.useKeywordMap(interactions, methodSpecificMapping.keywords, toAddress)

            interpretation.exampleDescription = fillDescriptionTemplate(
                interpretationMapping.writeFunctions[method].exampleDescriptionTemplate,
                interpretation,
            )
        } else {
            console.log('contract type', decodedData.contractType)
            if (decodedData.contractType !== ContractType.OTHER) {
                interpretGenericToken(decodedData, interpretation, this.userAddress)
            } else {
                lastFallback(decodedData, interpretation, this.userAddress)
            }
        }
        interpretation.exampleDescription = shortenNamesInString(interpretation.exampleDescription)
        return interpretation
    }

    private findValue(
        interactions: Interaction[],
        keyMapping: KeyMapping,
        userAddress: Address,
        contractAddress: Address,
    ): string | string[] {
        const filters = keyMapping.filters || {}
        const index = keyMapping.index || 0
        const array = keyMapping.array || false

        let filteredInteractions = deepCopy(interactions) as Interaction[]

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

        let value = null

        if (!array) {
            const interaction = filteredInteractions[index]
            const prefix = keyMapping.prefix || ''
            const str = (interaction as any)?.[keyMapping.key] || interaction?.events[index]?.[keyMapping.key]
            const postfix = keyMapping.postfix || ''
            value = str ? prefix + str + postfix : keyMapping.defaultValue
        } else {
            value = []
            const prefix = keyMapping.prefix || ''
            const postfix = keyMapping.postfix || ''

            // if the key is in the interaction-level, just loop through those
            if ((filteredInteractions[0] as any)?.[keyMapping.key]) {
                for (const interaction of filteredInteractions) {
                    const str = (interaction as any)?.[keyMapping.key]
                    const fullStr = str ? prefix + str + postfix : keyMapping.defaultValue
                    value.push(fullStr)
                }
                // if the key is in the event-level, we need to loop through the events in each interaction
            } else {
                for (const interaction of filteredInteractions) {
                    for (const event of interaction.events) {
                        const str = event[keyMapping.key]
                        const fullStr = str ? prefix + str + postfix : keyMapping.defaultValue
                        value.push(fullStr)
                    }
                }
            }
        }

        return value
    }

    private getTokens(interactions: Interaction[], userAddress: Address, direction: 'to' | 'from'): Token[] {
        let tokens: Token[] = []
        type FlattenedInteraction = Omit<Interaction, 'events'> & InteractionEvent

        let filteredInteractions = deepCopy(interactions) as Interaction[]

        const toKeys = ['to', '_to']
        const fromKeys = ['from', '_from']
        const transferEvents = ['Transfer', 'TransferBatch', 'TransferSingle']

        for (const interaction of filteredInteractions) {
            // filter non-transfer events
            interaction.events = interaction.events.filter((d) => transferEvents.includes(d.event))
            // filter out events that aren't to/from the user in the right direction
            interaction.events = interaction.events.filter((d) => toOrFromUser(d, direction, userAddress))
        }

        // filter out interactions without any of the events we want
        filteredInteractions = filteredInteractions.filter(
            (i) =>
                i.events.filter(
                    (d) => transferEvents.includes(d.event), // filters out all non transfer events
                ).length > 0, // filters out interactions that don't have any events objects left
        )

        // console.log('filteredInteractions', filteredInteractions[0].events)
        const flattenedInteractions = flattenEvents(filteredInteractions)

        function getTokenType(interaction: FlattenedInteraction): TokenType {
            const LPTokenSymbols = ['UNI-V2']
            let tokenType = TokenType.DEFAULT

            // LP Token
            if (LPTokenSymbols.includes(interaction.contractSymbol)) {
                tokenType = TokenType.LPToken
                // ERC-1155
            } else if (interaction._amount || interaction._amounts) {
                tokenType = TokenType.ERC1155
                // ERC-721
            } else if (interaction.tokenId) {
                tokenType = TokenType.ERC721
                // ERC-20
            } else if (Number(interaction.value) > 0) {
                tokenType = TokenType.ERC20
            }

            return tokenType
        }

        function toOrFromUser(event: InteractionEvent, direction: 'to' | 'from', userAddress: Address) {
            const directionArr = direction === 'to' ? toKeys : fromKeys
            return directionArr.filter((key) => event[key] === userAddress).length > 0
        }

        // each transfer event can have a token in it. for example, minting multiple NFTs
        function flattenEvents(interactions: Interaction[]) {
            const flattenedInteractions: FlattenedInteraction[] = []

            let flattenedInteraction: FlattenedInteraction
            for (const interaction of interactions) {
                flattenedInteraction = deepCopy(interaction) as FlattenedInteraction
                delete flattenedInteraction.events

                for (const event of interaction.events) {
                    if (event._amounts) {
                        // ERC1155 you can batchTransfer multiple tokens, each w their own amount, in 1 event
                        for (const [index, amount] of event._amounts.entries()) {
                            let newInteraction = deepCopy(flattenedInteraction)
                            newInteraction._id = event._ids ? event._ids[index] : null
                            newInteraction._amount = amount
                            newInteraction = { ...newInteraction, ...event }
                            flattenedInteractions.push(newInteraction)
                        }
                    } else {
                        flattenedInteraction = { ...flattenedInteraction, ...event }
                        flattenedInteractions.push(flattenedInteraction)
                    }
                }
                // console.log('flattenedInteraction', flattenedInteraction)
            }

            return flattenedInteractions
        }

        tokens = flattenedInteractions.map((i) => {
            const tokenType = getTokenType(i)

            const amount = tokenType === TokenType.ERC1155 ? i._amount : i.value
            const tokenId = (tokenType === TokenType.ERC1155 ? i._id : i.tokenId)?.toString()

            const token: Token = {
                type: tokenType,
                name: i.contractName,
                symbol: i.contractSymbol,
                address: i.contractAddress,
            }
            amount ? (token.amount = amount) : null
            tokenId ? (token.tokenId = tokenId) : null

            return token
        })

        return tokens
    }

    private getTokensReceived(interactions: Interaction[], userAddress: Address): Token[] {
        return this.getTokens(interactions, userAddress, 'to')
    }

    private getTokensSent(interactions: Interaction[], userAddress: Address): Token[] {
        return this.getTokens(interactions, userAddress, 'from')
    }

    private useKeywordMap(
        interactions: Interaction[],
        keywordsMap: Record<string, KeyMapping>,
        contractAddress: Address,
    ): Record<string, string | string[]> {
        const keyValueMap: Record<string, string | string[]> = {}

        const ignoreKeys = ['action', 'contractName', 'exampleDescription']

        for (const [key, value] of Object.entries(keywordsMap).filter(([key]) => !ignoreKeys.includes(key))) {
            // if the value is a string, we can just use it
            if (typeof value === 'string') {
                keyValueMap[key] = value

                // some data requires searching for it
            } else if (typeof value === 'object') {
                keyValueMap[key] = this.findValue(interactions, value, this.userAddress, contractAddress)

                if (Array.isArray(keyValueMap[key])) {
                    keyValueMap[`${key}Count`] = keyValueMap[key].length.toString()
                }
            }
        }

        return keyValueMap
    }
}

export default Interpreter
