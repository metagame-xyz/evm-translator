/* eslint-disable @typescript-eslint/no-non-null-assertion */
import contractInterpreters from './contractInterpreters'
import { getActionForDoubleSidedTx } from './DoubleSidedTxInterpreter'
import contractDeployInterpreter from './genericInterpreters/ContractDeploy.json'
import interpretGnosisExecution from './genericInterpreters/gnosis'
import lastFallback from './genericInterpreters/lastFallback'
import interpretGenericToken from './genericInterpreters/token'
import interpretGenericTransfer from './genericInterpreters/transfer'
import { BigNumber } from 'ethers'
import { formatEther, formatUnits } from 'ethers/lib/utils'

import { InterpreterMap, MethodMap } from 'interfaces/contractInterpreter'
import { ContractType, DecodedTx, Interaction, InteractionEvent, TxType } from 'interfaces/decoded'
import { Action, Interpretation, Token, TokenType } from 'interfaces/interpreted'
import { Chain } from 'interfaces/utils'
import { AddressZ } from 'interfaces/utils'

import {
    checkMultipleKeys,
    fillDescriptionTemplate,
    flattenEventsFromInteractions,
    getNativeTokenValueEvents,
    shortenNamesInString,
    toOrFromUser,
} from 'utils'
import { multicallContractAddresses, multicallFunctionNames } from 'utils/constants'
import { DatabaseInterface, NullDatabaseInterface } from 'utils/DatabaseInterface'

function deepCopy<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
}

type ContractInterpretersMap = Record<string, InterpreterMap>

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

function includes<T extends U, U>(collection: ReadonlyArray<T>, element: U): element is T {
    return collection.includes(element as T)
}

const topLevelInteractionKeys = ['contractName', 'contractSymbol', 'contractAddress'] as const

class Interpreter {
    contractSpecificInterpreters: ContractInterpretersMap = {}
    // fallbackInterpreters: Array<Inspector> = []
    userAddress: string | null
    chain: Chain
    db: DatabaseInterface

    constructor(chain: Chain, userAddress: string | null = null, db: DatabaseInterface | null = null) {
        this.chain = chain
        this.userAddress = (userAddress && AddressZ.parse(userAddress)) || null
        this.db = db || new NullDatabaseInterface()

        for (const [address, map] of Object.entries(contractInterpreters)) {
            this.contractSpecificInterpreters[address.toLowerCase()] = map as InterpreterMap
        }
    }

    updateUserAddress(userAddress: string) {
        this.userAddress = AddressZ.parse(userAddress)
    }

    updateChain(chain: Chain) {
        this.chain = chain
    }

    async interpret(decodedDataArr: DecodedTx[]): Promise<Interpretation[]> {
        const interpretations: Interpretation[] = []

        for (let i = 0; i < decodedDataArr.length; i++) {
            const decodedData = decodedDataArr[i]
            const interpretation = await this.interpretSingleTx(decodedData)
            interpretations.push(interpretation)
        }

        return interpretations
    }

    async interpretSingleTx(
        decodedData: DecodedTx,
        userAddressFromInput: string | null = null,
        userNameFromInput: string | null = null,
    ): Promise<Interpretation> {
        // Prep data coming in from 'decodedData'
        const {
            methodCall: { name: methodName },
            traceCalls,
            interactions,
            fromAddress,
            toAddress,
            timestamp,
            nativeValueSent,
            txHash,
            contractName,
            officialContractName,
        } = decodedData

        const gasUsed = formatEther(
            BigNumber.from(decodedData.gasUsed).mul(BigNumber.from(decodedData.effectiveGasPrice)),
        )

        const parsedAddress = AddressZ.safeParse(userAddressFromInput)

        const userAddress = parsedAddress.success ? parsedAddress.data : this.userAddress || fromAddress

        let userName = null

        if (fromAddress === userAddress) {
            userName = decodedData.fromENS
        }
        if (toAddress === userAddress) {
            userName = decodedData.toENS
        }

        userName =
            userName ||
            userNameFromInput ||
            (await this.db.getEntityByAddress(userAddress)) ||
            userAddress.substring(0, 6)

        // TODO generalize this so it'll get any ENS (ex: _operatorENS)

        // not contract-specific
        const interpretation: Interpretation = {
            txHash,
            userAddress,
            contractAddress: toAddress,
            actions: [],
            nativeValueSent: this.getNativeTokenValueSent(interactions, nativeValueSent, fromAddress, userAddress),
            nativeValueReceived: this.getNativeTokenValueReceived(interactions, userAddress),
            tokensReceived: this.getTokensReceived(interactions, userAddress),
            tokensSent: this.getTokensSent(interactions, userAddress),
            chainSymbol: this.chain.symbol,
            userName,
            gasPaid: gasUsed,
            extra: {},
            exampleDescription: 'no example description defined',
            reverted: decodedData.reverted ? true : null,
            contractName: contractName || officialContractName,
            counterpartyName: null,
            timestamp,
        }

        let fromName = await this.db.getEntityByAddress(fromAddress)
        let toName = await this.db.getEntityByAddress(toAddress || '')

        if (fromName) interpretation.fromName = fromName
        if (toName) interpretation.toName = toName

        fromName = fromName || fromAddress.substring(0, 6)
        toName = toName || (toAddress || '').substring(0, 6)

        if (interpretation.reverted) {
            interpretation.exampleDescription = 'transaction reverted'
            return interpretation
            // TODO the description and extras should be different for reverted transactions
        }

        const interpretationMapping: InterpreterMap | null =
            (toAddress && this.contractSpecificInterpreters[toAddress.toLowerCase()]) || null
        const methodSpecificMappings: MethodMap[] = []

        // If multicall, use trace calls to get method speicifc mappings and actions
        // If not, use main method call
        if (multicallFunctionNames.includes(methodName || '') && multicallContractAddresses.includes(toAddress || '')) {
            traceCalls?.forEach((call) => {
                const newMethodSpecificMapping = interpretationMapping?.writeFunctions[call.name || '']
                if (newMethodSpecificMapping) {
                    methodSpecificMappings.push(newMethodSpecificMapping)
                }
            })
        } else {
            const newMethodSpecificMapping = interpretationMapping?.writeFunctions[methodName || '']
            if (newMethodSpecificMapping) {
                methodSpecificMappings.push(newMethodSpecificMapping)
            }
        }

        // if there's no contract-specific mapping, try to use the fallback mapping
        if (decodedData.txType === TxType.CONTRACT_DEPLOY) {
            // Contract deploy
            interpretation.actions = [Action.deployed]
            interpretation.exampleDescription = contractDeployInterpreter.exampleDescription

            interpretation.extra = {
                ...interpretation.extra,
                ...this.useKeywordMap(interactions, contractDeployInterpreter.keywords, '0x_DOESNT_EXIST', userAddress),
            }

            interpretation.exampleDescription = fillDescriptionTemplate(
                contractDeployInterpreter.exampleDescriptionTemplate,
                interpretation,
            )
        } else if (decodedData.txType === TxType.TRANSFER) {
            // Generic transfer
            interpretGenericTransfer(decodedData, interpretation, fromName, toName)
        } else if (interpretationMapping && methodSpecificMappings.length && methodName && toAddress) {
            // Contract-specific interpretation
            // some of these will be arbitrary keys
            interpretation.contractName = interpretationMapping.contractName

            for (const methodSpecificMapping of methodSpecificMappings) {
                if (methodSpecificMapping.action !== Action.__NFTSALE__) {
                    interpretation.actions.push(methodSpecificMapping.action)
                } else {
                    interpretation.actions.push(getActionForDoubleSidedTx(interpretation))
                }
            }

            interpretation.exampleDescription = methodSpecificMappings[0].exampleDescription

            if (decodedData.reverted) {
                interpretation.reverted = true
                // TODO the description and extras should be different for reverted transactions
            }
            interpretation.extra = this.useKeywordMap(
                interactions,
                methodSpecificMappings[0].keywords,
                toAddress,
                userAddress,
            )
            interpretation.exampleDescription = fillDescriptionTemplate(
                interpretationMapping.writeFunctions[methodName].exampleDescriptionTemplate,
                interpretation,
            )
        } else {
            if (decodedData.contractType === ContractType.GNOSIS) {
                interpretGnosisExecution(decodedData, interpretation)
            } else if (decodedData.contractType !== ContractType.OTHER) {
                interpretGenericToken(decodedData, interpretation)
            } else {
                lastFallback(decodedData, interpretation)
            }
        }
        interpretation.exampleDescription = shortenNamesInString(interpretation.exampleDescription)
        return interpretation
    }
    getNativeTokenValueSent(
        interactions: Interaction[],
        nativeValueSent: string | undefined,
        fromAddress: string,
        userAddress: string,
    ): string {
        if (fromAddress === userAddress)
            return Number(formatEther(nativeValueSent || 0))
                .toString()
                .replace(/^(\d+\.\d*?[0-9])0+$/g, '$1')

        const nativeTokenEvents = getNativeTokenValueEvents(interactions)
        const nativeTokenEventsReceived = nativeTokenEvents.filter((event) => event.params.from === userAddress)
        const val = nativeTokenEventsReceived.reduce(
            (acc, event) => acc + Number(formatEther(event.params.value || 0)),
            0,
        )
        return val.toFixed(20).replace(/^(\d+\.\d*?[0-9])0+$/g, '$1')
    }
    getNativeTokenValueReceived(interactions: Interaction[], userAddress: string): string {
        const nativeTokenEvents = getNativeTokenValueEvents(interactions)
        const nativeTokenEventsReceived = nativeTokenEvents.filter((event) => event.params.to === userAddress)
        const val = nativeTokenEventsReceived.reduce(
            (acc, event) => acc + Number(formatEther(event.params.value || 0)),
            0,
        )

        return val.toFixed(20).replace(/^(\d+\.\d*?[0-9])0+$/g, '$1')
    }

    private findValue(
        interactions: Interaction[],
        keyMapping: KeyMapping,
        userAddress: string,
        contractAddress: string,
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
                if (!includes(topLevelInteractionKeys, key)) {
                    interaction.events = interaction.events.filter(
                        (d) =>
                            checkMultipleKeys(d, key, valueToFind) ||
                            d.params[key] === valueToFind ||
                            d.eventName === valueToFind,
                    )
                }
            }

            // if there aren't any events left, we don't want that interaction
            filteredInteractions = filteredInteractions.filter((i) => i.events.length > 0)

            // filter out interactions by top level key
            if (includes(topLevelInteractionKeys, key)) {
                filteredInteractions = filteredInteractions.filter((i) => i[key] === valueToFind)
            }
        }

        let value = null

        if (!array) {
            const interaction = filteredInteractions[index]
            const prefix = keyMapping.prefix || ''
            let str
            // unclear if "index" refers specifies an interaction or an event
            // this logic figures that out
            if ((interaction as any)?.[keyMapping.key]) {
                str = (interaction as any)?.[keyMapping.key]
            } else {
                const flattenedEvents = flattenEventsFromInteractions(filteredInteractions)
                str =
                    checkMultipleKeys(flattenedEvents[index], keyMapping.key) ||
                    flattenedEvents[index]?.params[keyMapping.key]
            }
            const postfix = keyMapping.postfix || ''
            value = str ? prefix + str + postfix : keyMapping.defaultValue
        } else {
            value = []
            const prefix = keyMapping.prefix || ''
            const postfix = keyMapping.postfix || ''

            // I dont think anything but params will ever use this array feature, so we only support params here for now

            // if the key is in the interaction-level, just loop through those
            // if ((filteredInteractions[0] as any)?.[keyMapping.key]) {
            //     for (const interaction of filteredInteractions) {
            //         const str = (interaction as any)?.[keyMapping.key]
            //         const fullStr = str ? prefix + str + postfix : keyMapping.defaultValue
            //         value.push(fullStr)
            //     }
            // } else {
            for (const interaction of filteredInteractions) {
                for (const event of interaction.events) {
                    const str = event.params[keyMapping.key]
                    const fullStr = str ? prefix + str + postfix : keyMapping.defaultValue
                    value.push(fullStr)
                }
            }
            //}
        }

        return value
    }

    private getTokens(interactions: Interaction[], userAddress: string, direction: 'to' | 'from'): Token[] {
        let tokens: Token[] = []
        type FlattenedInteraction = Omit<Interaction, 'events'> & InteractionEvent

        let filteredInteractions = deepCopy(interactions) as Interaction[]

        const transferEvents = ['Transfer', 'TransferBatch', 'TransferSingle']

        for (const interaction of filteredInteractions) {
            // filter non-transfer events
            interaction.events = interaction.events.filter((d) => transferEvents.includes(d.eventName || ''))
            // filter out events that aren't to/from the user in the right direction
            interaction.events = interaction.events.filter((d) => toOrFromUser(d, direction, userAddress))
        }

        // filter out interactions without any of the events we want
        filteredInteractions = filteredInteractions.filter(
            (i) =>
                i.events.filter(
                    (d) => transferEvents.includes(d.eventName || ''), // filters out all non transfer events
                ).length > 0, // filters out interactions that don't have any events objects left
        )

        const flattenedInteractions = flattenEvents(filteredInteractions)

        function getTokenType(interaction: FlattenedInteraction): TokenType {
            const LPTokenSymbols = ['UNI-V2']
            let tokenType = TokenType.DEFAULT

            // LP Token
            if (interaction.contractSymbol && LPTokenSymbols.includes(interaction.contractSymbol)) {
                tokenType = TokenType.LPToken
                // ERC-1155
            } else if (
                interaction.contractType == ContractType.ERC1155 ||
                interaction.params._amount ||
                interaction.params._amounts
            ) {
                tokenType = TokenType.ERC1155
                // ERC-721
            } else if (interaction.contractType == ContractType.ERC721 || interaction.params.tokenId) {
                tokenType = TokenType.ERC721
                // ERC-20
            } else if (interaction.contractType == ContractType.ERC20 || Number(interaction.params.value) > 0) {
                tokenType = TokenType.ERC20
            }

            return tokenType
        }

        // each transfer event can have a token in it. for example, minting multiple NFTs
        function flattenEvents(interactions: Interaction[]) {
            const flattenedInteractions: FlattenedInteraction[] = []

            let flattenedInteraction: FlattenedInteraction
            for (const interaction of interactions) {
                const copiedInteraction = deepCopy(interaction) as any
                delete copiedInteraction.events
                flattenedInteraction = copiedInteraction

                for (const event of interaction.events) {
                    if (event.params._amounts) {
                        // ERC1155 you can batchTransfer multiple tokens, each w their own amount, in 1 event
                        for (const [index, amount] of event.params._amounts.entries()) {
                            let newInteraction = deepCopy(flattenedInteraction)
                            const newEvent = deepCopy(event)
                            newEvent.params._id = event.params._ids
                                ? BigNumber.from(event.params._ids[index]).toString()
                                : null
                            delete newEvent.params._ids
                            newEvent.params._amount = BigNumber.from(amount).toString()
                            delete newEvent.params._amounts
                            newInteraction = { ...newInteraction, ...newEvent }
                            flattenedInteractions.push(newInteraction)
                        }
                    } else {
                        flattenedInteraction = { ...flattenedInteraction, ...event }
                        flattenedInteractions.push(flattenedInteraction)
                    }
                }
            }

            return flattenedInteractions
        }

        tokens = flattenedInteractions.map((i) => {
            const tokenType = getTokenType(i)

            const amount =
                tokenType === TokenType.ERC1155 ? i.params._amount : i.params.value || i.params.amount || i.params.wad
            const tokenId = (tokenType === TokenType.ERC1155 ? i.params._id : i.params.tokenId)?.toString()

            const token: Token = {
                type: tokenType,
                name: i.contractName,
                symbol: i.contractSymbol,
                address: AddressZ.parse(i.contractAddress),
            }

            if (amount) {
                let decimal = 18
                if (tokenType === TokenType.ERC1155) {
                    decimal = 0
                } else if ([this.chain.usdcAddress, this.chain.usdtAddress].includes(i.contractAddress)) {
                    decimal = 6 // TODO need to store the "decimal()" for all contracts and either store it on decoded, or call the db during interpretations
                }

                const amountNumber = Number(formatUnits(amount, decimal))

                token.amount = amountNumber.toFixed(12).replace(/^(\d+\.\d*?[0-9])0+$/g, '$1')

                // token.amount = amount
            }

            tokenId ? (token.tokenId = tokenId) : null

            return token
        })

        return tokens
    }

    private getTokensReceived(interactions: Interaction[], userAddress: string): Token[] {
        return this.getTokens(interactions, userAddress, 'to')
    }

    private getTokensSent(interactions: Interaction[], userAddress: string): Token[] {
        return this.getTokens(interactions, userAddress, 'from')
    }

    private useKeywordMap(
        interactions: Interaction[],
        keywordsMap: Record<string, KeyMapping>,
        contractAddress: string,
        userAddress: string,
    ): Record<string, string | string[]> {
        const keyValueMap: Record<string, string | string[]> = {}

        const ignoreKeys = ['action', 'contractName', 'exampleDescription']

        for (const [key, value] of Object.entries(keywordsMap).filter(([key]) => !ignoreKeys.includes(key))) {
            // if the value is a string, we can just use it
            if (typeof value === 'string') {
                keyValueMap[key] = value

                // some data requires searching for it
            } else if (typeof value === 'object') {
                keyValueMap[key] = this.findValue(interactions, value, userAddress, contractAddress)

                if (Array.isArray(keyValueMap[key])) {
                    keyValueMap[`${key}Count`] = keyValueMap[key].length.toString()
                }
            }
        }

        return keyValueMap
    }
}

export default Interpreter
