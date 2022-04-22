import {
    Action,
    Address,
    ContractType,
    Decoded,
    Interaction,
    InteractionEvent,
    Interpretation,
    Token,
    TokenType,
} from 'interfaces'
import { ensure, shortenName } from 'utils'
import { blackholeAddress } from 'utils/constants'

type TokenVars = {
    type: TokenType
    transfer: string
    approval: string
    to: string
    toENS: string
    from: string
    fromENS: string
    owner: string
    ownerENS: string
    operator: string
    operatorENS: string
    approved: string
    approvedENS: string
}

type EIP = Exclude<TokenType, 'LPToken' | 'unknown'>

const vars: Record<EIP, TokenVars> = {
    ERC1155: {
        type: TokenType.ERC1155,
        transfer: 'TransferSingle',
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

function isMintEvent(t: TokenVars, event: any, userAddress: Address) {
    return event.event === t.transfer && event[t.from] === blackholeAddress && event[t.to] === userAddress
}

function isSendEvent(t: TokenVars, event: any, userAddress: Address) {
    return event.event === t.transfer && event[t.from] === userAddress
}

function isReceiveEvent(t: TokenVars, event: any, userAddress: Address) {
    return event.event === t.transfer && event[t.to] === userAddress
}

function isApprovalEvent(t: TokenVars, event: any, userAddress: Address) {
    return event.event === t.approval && event[t.owner] === userAddress && event[t.approved] == true
}

function getAction(t: TokenVars, events: InteractionEvent[], userAddress: Address): Action {
    const isMint = events.find((e) => isMintEvent(t, e, userAddress))
    const isSend = events.find((e) => isSendEvent(t, e, userAddress))
    const isReceive = events.find((e) => isReceiveEvent(t, e, userAddress))
    const isApproved = events.find((e) => isApprovalEvent(t, e, userAddress))

    if (isMint) {
        return 'minted'
    } else if (isSend) {
        return 'sent'
    } else if (isReceive) {
        return 'received'
    } else if (isApproved) {
        return 'approved'
    }

    return '______TODO______'
}

function getTokenInfo(tokenContractInteraction: Interaction, interpretation: Interpretation): Token {
    switch (interpretation.action) {
        case 'minted':
        case 'received':
            return interpretation.tokensReceived[0]
        case 'sent':
            return interpretation.tokensSent[0]
        case 'approved': {
            return {
                type: TokenType.ERC721,
                name: tokenContractInteraction?.contractName,
                symbol: tokenContractInteraction?.contractSymbol,
                address: tokenContractInteraction?.contractAddress,
            }
        }
        default:
            console.log('getTokenInfo action not supported: ')
            return {
                type: TokenType.DEFAULT,
                name: '',
                symbol: '',
                address: '',
            }
    }
}

function addUserName(
    t: TokenVars,
    interpretation: Interpretation,
    tokenEvents: InteractionEvent[],
    userAddress: Address,
) {
    let userName = interpretation.userName
    switch (interpretation.action) {
        case 'received':
            userName = tokenEvents
                .filter((e) => isReceiveEvent(t, e, userAddress))
                .map((e) => e[t.toENS] || (e[t.to] as string))[0]
            break
        default:
            break
    }
    interpretation.userName = shortenName(userName)
}

function addCounterpartyNames(
    t: TokenVars,
    interpretation: Interpretation,
    tokenEvents: InteractionEvent[],
    userAddress: Address,
) {
    let counterpartyNames: string[] = []

    switch (interpretation.action) {
        case 'received':
            counterpartyNames = tokenEvents
                .filter((e) => isReceiveEvent(t, e, userAddress))
                .map((e) => e[t.fromENS] || (e[t.from] as string))
            break
        case 'sent':
            counterpartyNames = tokenEvents
                .filter((e) => isSendEvent(t, e, userAddress))
                .map((e) => e[t.toENS] || (e[t.to] as string))
            break
        case 'approved':
            counterpartyNames = tokenEvents
                .filter((e) => isApprovalEvent(t, e, userAddress))
                .map((e) => e[t.operatorENS] || (e[t.operator] as string))
            break
        default:
            break
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
    let exampleDescription = ''
    const i = interpretation
    const { userName, action } = i
    const { name: tokenName } = token
    const symbol = token.symbol ? ' ' + token.symbol : ' ???'
    const tokenId = token.tokenId ? ' #' + token.tokenId : ''
    const amount = token.amount ? ' ' + token.amount : ''

    let tokenCount: any = 0
    let counterpartyName = i.extra.counterpartyNames?.length ? i.extra.counterpartyNames[0] : i.counterpartyName || ''
    counterpartyName = counterpartyName ? ' ' + counterpartyName : ''
    let direction = ''

    switch (action) {
        case 'minted': {
            const tokenCount = i.tokensReceived.filter((t) => t.address === token.address).length
            counterpartyName = ' ' + tokenName
            direction = ' from'
            break
        }
        case 'received':
            tokenCount = i.tokensReceived.length
            direction = ' from'
            break
        case 'sent':
            tokenCount = i.tokensSent.length
            direction = ' to'
            break
        case 'approved':
            direction = ' to be managed by'
            break
        default:
            break
    }

    tokenCount = tokenCount > 1 ? ' ' + tokenCount : ''
    exampleDescription = `${userName} ${action}${amount}${tokenCount}${symbol}${tokenId}${direction}${counterpartyName}`

    interpretation.exampleDescription = exampleDescription
}

function interpretGenericToken(decodedData: Decoded, interpretation: Interpretation, userAddress: Address) {
    if (decodedData.contractType === ContractType.OTHER) {
        throw new Error('Token type not supported')
    }
    const t = vars[decodedData.contractType]

    console.log('generic erc721 hash: ', decodedData.txHash)
    console.log(decodedData)
    console.log(decodedData.interactions.map((i) => console.log(i.events)))
    console.log(interpretation)
    const tokenContractInteraction = ensure(
        decodedData.interactions.find((interaction) => interaction.contractAddress === decodedData.toAddress),
    )
    const tokenEvents = tokenContractInteraction?.events || []

    interpretation.action = getAction(t, tokenEvents, userAddress)

    const token = getTokenInfo(tokenContractInteraction, interpretation)

    addUserName(t, interpretation, tokenEvents, userAddress)
    addCounterpartyNames(t, interpretation, tokenEvents, userAddress)
    addExampleDescription(interpretation, token)
}

export default interpretGenericToken
