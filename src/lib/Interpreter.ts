import Inspector, { Config } from './Inspector'
import { ActivityEntry, Interaction, Interpretation, Token, TokenType } from '@/types/activity'
import defaultContractInterpreters from './contractInterpreters'
import { Address } from '@/types/utils'

function deepCopy(obj: any) {
    return JSON.parse(JSON.stringify(obj))
}

type ContractInterpretersMap = Record<Address, any>

type KeyMapping = {
    key: string
    default_value: string
    filters?: {
        event?: string
        to?: string
        from?: string
        value?: string
    }
    index?: number
    prefix?: string
    postfix?: string
}

const TopLevelInteractionKeys = ['contract', 'contract_symbol', 'contract_address']
function isTopLevel(key: string) {
    return TopLevelInteractionKeys.includes(key)
}

class Interpreter {
    contractSpecificInterpreters: ContractInterpretersMap
    fallbackInterpreters: Array<Inspector> = []
    userAddress: Address

    constructor(
        userAddress: Address,
        contractInterpreters: ContractInterpretersMap = defaultContractInterpreters,
    ) {
        this.contractSpecificInterpreters = contractInterpreters
        this.fallbackInterpreters = [] //Todo
        this.userAddress = userAddress
    }

    private findValue(
        interactions: Interaction[],
        keyMapping: KeyMapping,
        userAddress: Address,
    ): string {
        const filters = keyMapping.filters
        const index = keyMapping.index || 0

        console.log('interactions', interactions)
        let filteredInteractions = deepCopy(interactions)

        // console.log('interactions', interactions)

        for (const [key, value] of Object.entries(filters)) {
            let valueToFind = value

            // special case for when we want to match on the contextualized user address
            if (value === '{user_address}') valueToFind = userAddress

            // filter out by details that don't have the keys we want
            for (let interaction of filteredInteractions) {
                if (!isTopLevel(key)) {
                    interaction.details = interaction.details.filter((d) => d[key] === valueToFind)
                }
            }

            // if there aren't any details left, we don't want that interaction
            filteredInteractions = filteredInteractions.filter((i) => i.details.length > 0)

            // filter out interactions by top level ke
            if (isTopLevel(key)) {
                filteredInteractions = filteredInteractions.filter((i) => i[key] === valueToFind)
            }
        }
        // console.log('keyMapping.key', keyMapping.key)

        const interaction = filteredInteractions[index]
        const prefix = keyMapping.prefix || ''
        const str = interaction?.[keyMapping.key]
        const postfix = keyMapping.postfix || ''
        const value = str ? prefix + str + postfix : keyMapping.default_value

        return value
    }

    private getTokens(
        interactions: Interaction[],
        userAddress: Address,
        direction: 'to' | 'from',
    ): Token[] {
        let tokens: Token[] = []

        let filteredInteractions = deepCopy(interactions)

        const toKeys = ['to', '_to']
        const fromKeys = ['from', '_from']
        const transferEvents = ['Transfer', 'TransferBatch', 'TransferSingle']

        // filter non-transfer  events only
        for (let interaction of filteredInteractions) {
            interaction.details = interaction.details.filter((d) =>
                transferEvents.includes(d.event),
            )
        }

        // filter out interactions without any of the events we want
        filteredInteractions = filteredInteractions.filter(
            (i) =>
                i.details.filter(
                    (d) =>
                        transferEvents.includes(d.event) && // filters out all non transfer events
                        toOrFromUser(d, direction, userAddress), // filters out detail objects that aren't the right direction, and to the user
                ).length > 0, // filters out interactions that don't have any details objects left
        )

        function getTokenType(interaction: Interaction): TokenType {
            const LPTokenSymbols = ['UNI-V2']
            let tokenType = TokenType.DEFAULT

            // LP Token
            if (LPTokenSymbols.includes(interaction.contract_symbol)) {
                tokenType = TokenType.LPToken
                // ERC-1155
            } else if (interaction.details[0]._amount || interaction.details[0]._amounts) {
                tokenType = TokenType.ERC1155
                // ERC-721
            } else if (interaction.details[0].tokenId) {
                tokenType = TokenType.ERC721
                // ERC-20
            } else if (interaction.details[0].value > 0) {
                tokenType = TokenType.ERC20
            }

            return tokenType
        }

        function toOrFromUser(detail, direction: 'to' | 'from', userAddress) {
            const directionArr = direction === 'to' ? toKeys : fromKeys
            return directionArr.filter((key) => detail[key] === userAddress).length > 0
        }

        console.log('filteredInteractions', filteredInteractions)

        // TODO this is only ERC20 tokens
        tokens = filteredInteractions.map((i) => {
            const tokenType = getTokenType(i)

            console.log('token', i.details)

            return {
                type: tokenType,
                name: i.contract,
                symbol: i.contract_symbol,
                address: i.contract_address,
                amount: i.details[0].value,
                tokenId: i.details[0].tokenId,
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

    private

    private useMapping(
        interactions: Interaction[],
        interpretationMapping: any,
        methodSpecificMapping: any,
    ) {
        const keysRequired: Array<string> = getInputsFromTemplate(
            methodSpecificMapping.example_description_template,
        )
        const keyValueMap: Record<string, string> = {}

        for (let key of keysRequired) {
            const methodSpecificValue = methodSpecificMapping[key]

            // contract_address is in the top level
            if (interpretationMapping[key]) {
                keyValueMap[key] = interpretationMapping[key]

                // action and others are store in the methodSpecificMapping
            } else if (typeof methodSpecificValue === 'string') {
                keyValueMap[key] = methodSpecificValue

                // project_name and other data is stored somewhere in the interactions
            } else if (typeof methodSpecificValue === 'object') {
                keyValueMap[key] = this.findValue(
                    interactions,
                    methodSpecificValue,
                    this.userAddress,
                )
            }
        }

        console.log('keyValueMap', keyValueMap)

        return keyValueMap
    }

    private fillDescriptionTemplate(template: string, keyValueMap: Record<string, string>) {
        for (let key in keyValueMap) {
            const value = keyValueMap[key]

            template = template.replace(`{${key}}`, value)
        }

        return template
    }

    public interpret(activity: ActivityEntry): Interpretation {
        const method = activity.insights.method
        const interactions = activity.insights.interactions

        let interpretationMapping
        let methodSpecificMapping
        let interpretation: Interpretation

        // not contract-specific
        interpretation = {
            ether_sent: activity.value_in_eth,
            tokens_received: this.getTokensReiceived(interactions, this.userAddress),
            tokens_sent: this.getTokensSent(interactions, this.userAddress),
        }

        interpretationMapping = this.contractSpecificInterpreters[activity.raw.to]
        methodSpecificMapping = interpretationMapping?.[method]

        // contract-specific interpretation
        if (interpretationMapping && methodSpecificMapping) {
            const keyValueMap = this.useMapping(
                interactions,
                interpretationMapping,
                methodSpecificMapping,
            )

            keyValueMap.ether_sent = activity.value_in_eth
            keyValueMap.user_name = activity.insights.fromENS || activity.raw.from.substring(0, 6)

            // generate example description
            const exampleDescription = this.fillDescriptionTemplate(
                interpretationMapping[method].example_description_template,
                keyValueMap,
            )

            interpretation = {
                ...interpretation,
                ...keyValueMap,
                example_description: exampleDescription,
            }

            // interpretation.contract_name = keyValueMap.contract_name
            // interpretation.action = keyValueMap.action as Action
            // interpretation.example_description = exampleDescription
        } else {
            // fallback interpretation
        }

        return interpretation
    }
}

export default Interpreter

function getInputsFromTemplate(template: string) {
    const regex = /(?<=\{).+?(?=\})/g
    const matches = template.match(regex)
    return matches ? matches : []
}
