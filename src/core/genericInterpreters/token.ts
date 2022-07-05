import { ContractType, DecodedTx, Interaction, InteractionEvent } from 'interfaces/decoded'
import { Action, Interpretation, Token, TokenType } from 'interfaces/interpreted'

import { shortenName } from 'utils'
import { blackholeAddress } from 'utils/constants'

type TokenVars = {
    type: TokenType
    transfer: string
    transferBatch: string | null
    approval: string
    to: string
    toENS: '_toENS' | 'toENS'
    from: string
    fromENS: '_fromENS' | 'fromENS'
    owner: string
    ownerENS: string
    operator: '_operator'
    operatorENS: '_operatorENS'
    approved: string
    approvedENS: string
}

type EIP = Exclude<ContractType, 'OTHER' | 'Gnosis Safe'>

const vars: Record<EIP, TokenVars> = {
    ERC1155: {
        type: TokenType.ERC1155,
        transfer: 'TransferSingle',
        transferBatch: 'TransferBatch',
        approval: 'ApprovalForAll',
        to: '_to',
        toENS: '_toENS',
        from: '_from',
        fromENS: '_fromENS',
        owner: '_owner',
        ownerENS: '_ownerENS',
        operator: '_operator',
        operatorENS: '_operatorENS',
        approved: '_approved',
        approvedENS: '_approvedENS',
    },
    ERC721: {
        type: TokenType.ERC721,
        transfer: 'Transfer',
        transferBatch: null,
        approval: 'ApprovalForAll',
        to: 'to',
        toENS: 'toENS',
        from: 'from',
        fromENS: 'fromENS',
        owner: '_owner',
        ownerENS: '_ownerENS',
        operator: '_operator',
        operatorENS: '_operatorENS',
        approved: '_approved',
        approvedENS: '_approvedENS',
    },
    ERC20: {
        type: TokenType.ERC20,
        transfer: 'Transfer',
        transferBatch: null,
        approval: 'Approval',
        to: 'to',
        toENS: 'toENS',
        from: 'from',
        fromENS: 'fromENS',
        owner: '_owner',
        ownerENS: '_ownerENS',
        operator: '_operator',
        operatorENS: '_operatorENS',
        approved: '_approved',
        approvedENS: '_approvedENS',
    },
    WETH: {
        type: TokenType.ERC20,
        transfer: 'Transfer',
        transferBatch: null,
        approval: 'Approval',
        to: 'to',
        toENS: 'toENS',
        from: 'from',
        fromENS: 'fromENS',
        owner: '_owner',
        ownerENS: '_ownerENS',
        operator: '_operator',
        operatorENS: '_operatorENS',
        approved: '_approved',
        approvedENS: '_approvedENS',
    },
}

function isMintEvent(t: TokenVars, event: InteractionEvent, userAddress: string, fromAddress: string) {
    return (
        event.eventName === t.transfer &&
        event.params[t.from] === blackholeAddress &&
        event.params[t.to] === userAddress &&
        userAddress === fromAddress // user needs to have initiated the mint
    )
}
function isAirdropEvent(t: TokenVars, event: InteractionEvent, userAddress: string, fromAddress: string) {
    return (
        (event.eventName === t.transfer || event.eventName === t.transferBatch) &&
        event.params[t.from] === blackholeAddress &&
        event.params[t.to] === userAddress &&
        userAddress !== fromAddress // user needs to have initiated the mint
    )
}

function isSendEvent(t: TokenVars, event: InteractionEvent, userAddress: string) {
    return (
        (event.eventName === t.transfer || event.eventName === t.transferBatch) && event.params[t.from] === userAddress
    )
}

function isReceiveEvent(t: TokenVars, event: InteractionEvent, userAddress: string) {
    return event.eventName === t.transfer && event.params[t.to] === userAddress
}

function isApprovalEvent(t: TokenVars, event: InteractionEvent, userAddress: string) {
    return event.eventName === t.approval && event.params[t.owner] === userAddress && event.params[t.approved] == true
}

function getAction(t: TokenVars, events: InteractionEvent[], userAddress: string, fromAddress: string): Action {
    const isMint = events.find((e) => isMintEvent(t, e, userAddress, fromAddress))
    const isAirdrop = events.find((e) => isAirdropEvent(t, e, userAddress, fromAddress))
    const isSend = events.find((e) => isSendEvent(t, e, userAddress))
    const isReceive = events.find((e) => isReceiveEvent(t, e, userAddress))
    const isApproved = events.find((e) => isApprovalEvent(t, e, userAddress))

    if (isMint) {
        return Action.minted
    } else if (isAirdrop) {
        return Action.gotAirdropped
    } else if (isSend) {
        return Action.sent
    } else if (isReceive) {
        return Action.received
    } else if (isApproved) {
        return Action.approved
    }

    return Action.______TODO______
}

function getTokenInfo(tokenContractInteraction: Interaction, interpretation: Interpretation): Token {
    const { actions: action, tokensReceived, tokensSent } = interpretation
    if (action.length) {
        switch (action[0]) {
            case 'minted':
            case 'got airdropped':
            case 'received':
                return tokensReceived[0]
            case 'sent':
                return tokensSent[0]
            case 'approved': {
                return {
                    type: TokenType.ERC721, // TODO this is a hack for now, we should add tokenType to each interaction
                    name: tokenContractInteraction?.contractName,
                    symbol: tokenContractInteraction?.contractSymbol,
                    address: tokenContractInteraction?.contractAddress,
                }
            }
            default:
                // console.log('getTokenInfo action not supported: ')
                return {
                    type: TokenType.DEFAULT,
                    name: '',
                    symbol: '',
                    address: '0x',
                }
        }
    }
    return {
        type: TokenType.DEFAULT,
        name: '',
        symbol: '',
        address: '0x',
    }
}

function addUserName(
    t: TokenVars,
    interpretation: Interpretation,
    tokenEvents: InteractionEvent[],
    userAddress: string,
) {
    let userName = interpretation.userName
    if (interpretation.actions.length) {
        switch (interpretation.actions[0]) {
            case 'received':
                userName = tokenEvents
                    .filter((e) => isReceiveEvent(t, e, userAddress))
                    .map((e) => e.params[t.toENS] || (e.params[t.to] as string))[0]
                break
            default:
                break
        }
    }
    interpretation.userName = shortenName(userName)
}

function addCounterpartyNames(
    t: TokenVars,
    interpretation: Interpretation,
    tokenEvents: InteractionEvent[],
    userAddress: string,
    fromAddress: string,
) {
    let counterpartyNames: string[] = []
    if (interpretation.actions.length) {
        switch (interpretation.actions[0]) {
            case 'received':
                counterpartyNames = tokenEvents
                    .filter((e) => isReceiveEvent(t, e, userAddress))
                    .map((e) => e.params[t.fromENS] || (e.params[t.from] as string))
                break
            case 'sent':
                counterpartyNames = tokenEvents
                    .filter((e) => isSendEvent(t, e, userAddress))
                    .map((e) => e.params[t.toENS] || (e.params[t.to] as string))
                break
            case 'approved':
                counterpartyNames = tokenEvents
                    .filter((e) => isApprovalEvent(t, e, userAddress))
                    .map((e) => e.params[t.operatorENS] || (e.params[t.operator] as string))
                break
            case 'got airdropped':
                counterpartyNames = [fromAddress]
                break
            default:
                break
        }
    }

    counterpartyNames = counterpartyNames.map((n) => shortenName(n))
    if (counterpartyNames.length === 1) {
        interpretation.counterpartyName = counterpartyNames[0]
    }
    if (counterpartyNames.length > 1) {
        interpretation.extra.counterpartyNames = counterpartyNames
    }
}

function addExampleDescription(interpretation: Interpretation, token: Token) {
    const { tokensReceived, tokensSent } = interpretation
    let exampleDescription = ''
    const i = interpretation
    const { userName, actions: action } = i
    const { name: tokenName } = token

    const receivedSingle = tokensReceived.length === 1
    const sentSingle = tokensSent.length === 1

    const symbol = token.symbol ? ' ' + token.symbol : ' ???'
    let tokenId = token.tokenId ? ' #' + token.tokenId : ''
    const amount = token.amount ? ' ' + token.amount : ''

    let tokenCount: any = 0
    let counterpartyName = i.extra.counterpartyNames?.length ? i.extra.counterpartyNames[0] : i.counterpartyName || ''
    counterpartyName = counterpartyName ? ' ' + counterpartyName : ''
    let direction = ''
    if (interpretation.actions.length) {
        switch (action[0]) {
            case Action.minted: {
                tokenId = receivedSingle ? tokenId : ''
                tokenCount = i.tokensReceived.filter((t) => t.address === token.address).length
                counterpartyName = ' ' + tokenName
                direction = ' from'
                break
            }
            case Action.received:
            case Action.gotAirdropped:
                tokenId = receivedSingle ? tokenId : ''
                tokenCount = i.tokensReceived.length
                direction = ' from'
                break
            case Action.sent:
                tokenId = sentSingle ? tokenId : ''
                tokenCount = i.tokensSent.length
                direction = ' to'
                break
            case Action.approved:
                direction = ' to be managed by'
                break
            default:
                break
        }
    }

    tokenCount = tokenCount > 1 ? ' ' + tokenCount : ''
    exampleDescription = `${userName} ${action}${amount}${tokenCount}${symbol}${tokenId}${direction}${counterpartyName}`

    interpretation.exampleDescription = exampleDescription
}

function interpretGenericToken(decodedData: DecodedTx, interpretation: Interpretation) {
    const { userAddress } = interpretation
    const { fromAddress, toAddress, interactions, contractType, contractName } = decodedData

    if (contractType === ContractType.OTHER || contractType === ContractType.GNOSIS) {
        throw new Error('Token type not supported')
    }
    const t = vars[contractType]

    // console.log('generic erc721 hash: ', decodedData.txHash)
    // console.log(decodedData)
    // console.log(decodedData.interactions.map((i) => console.log(i.events)))
    // console.log(interpretation)

    const defaultTokenInteraction: Interaction = {
        contractName,
        contractSymbol: null,
        contractAddress: toAddress || '',
        contractType: ContractType.OTHER,
        events: [],
    }

    const tokenContractInteraction =
        interactions.find((interaction) => interaction.contractAddress === toAddress) || defaultTokenInteraction

    const tokenEvents = tokenContractInteraction?.events || []

    // use TokensReceived and TokensSent to determine the actions (besides mint), not the events. Bought, sold, traded
    interpretation.actions.push(getAction(t, tokenEvents, userAddress, fromAddress))

    const token = getTokenInfo(tokenContractInteraction, interpretation)

    addUserName(t, interpretation, tokenEvents, userAddress)
    addCounterpartyNames(t, interpretation, tokenEvents, userAddress, fromAddress)
    addExampleDescription(interpretation, token)
}

export default interpretGenericToken
