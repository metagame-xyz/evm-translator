import collect from 'collect.js'
import { BigNumber } from 'ethers'
import { Address, Chain, Chains, Interaction, InteractionEvent, Interpretation } from 'interfaces'
import { ABI_Item, ABI_ItemUnfiltered } from 'interfaces/abi'
import fetch, { Response } from 'node-fetch'
import traverse from 'traverse'

const ethereum: Chain = {
    EVM: true,
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    testnet: false,
    blockExplorerUrl: 'https://etherscan.io/',
    wethAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    usdcAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    usdtAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    daiAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
}

const polygon: Chain = {
    EVM: true,
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    testnet: false,
    blockExplorerUrl: 'https://polygonscan.com/',
    wethAddress: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
    usdcAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    usdtAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    daiAddress: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
}

export const chains: Chains = {
    ethereum,
    polygon,
}

export const getChainById = (id: number): Chain => {
    const chain = collect(chains).first((chain) => chain.id === id)
    if (!chain) {
        throw new Error(`Chain with id ${id} not found`)
    }
    return chain
}

export const getChainBySymbol = (symbol: string): Chain => {
    const chain = collect(chains).first((chain) => chain.symbol === symbol)
    if (!chain) {
        throw new Error(`Chain with symbol ${symbol} not found`)
    }
    return chain
}

export const getStablecoinOrNativeWrappedAddressesBySymbol = (symbol: string): Address[] => {
    const chain = getChainBySymbol(symbol)
    return [chain.wethAddress, chain.usdcAddress, chain.usdtAddress, chain.daiAddress]
}

export const isAddress = (address: string): boolean => {
    const validAddress = new RegExp(/^0x[a-fA-F0-9]{40}$/)
    return validAddress.test(address)
}

export const cleanseDataInPlace = (data: any): void => {
    traverse(data).forEach(function (x) {
        if (x instanceof BigNumber) {
            this.update(x.toString())
        }
        if (typeof x === 'undefined') {
            this.update(null)
        }
    })
}

const fetchOptions = {
    body: undefined,
}

export class FetcherError extends Error {
    status: any
    statusText: any
    url: any
    bodySent: any
    constructor({
        message,
        status,
        statusText,
        url,
        bodySent,
    }: {
        message: string
        status: any
        statusText: any
        url: any
        bodySent: any
    }) {
        super(message)
        this.name = 'Fetcher Error'
        this.status = status
        this.statusText = statusText
        this.url = url
        this.bodySent = bodySent
    }
    toJSON() {
        return {
            name: this.name,
            status: this.status,
            statusText: this.statusText,
            url: this.url,
            bodySent: this.bodySent,
            message: this.message,
        }
    }
}

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetcher(url: string, options = fetchOptions) {
    let retry = 3
    while (retry > 0) {
        const response: Response = await fetch(url, options)
        if (response.ok) {
            return response.json() as Promise<any>
        } else {
            const error = {
                status: response.status,
                statusText: response.statusText,
                url: response.url,
                bodySent: options.body ? JSON.parse(options.body) : null,
                message: await response.text(),
            }
            retry--
            if (retry === 0) {
                throw new FetcherError(error)
            }
            await sleep(2000)
        }
    }
}

export function fillDescriptionTemplate(template: string, interpretation: Interpretation): string {
    const merged = collect(interpretation.extra).merge(interpretation).all()

    for (const [key, value] of Object.entries(merged)) {
        if (typeof value === 'string') {
            template = template.replace(`{${key}}`, value)
        }
    }
    return template
}

export function ensure<T>(argument: T | undefined | null, message = 'This value was promised to be there.'): T {
    if (argument === undefined || argument === null) {
        throw new TypeError(message)
    }

    return argument
}

const validAddress = new RegExp(/^0x[a-fA-F0-9]{40}$/)

export const validateAddress = (address: string): Address => {
    if (!validAddress.test(address)) {
        throw new Error(`Invalid EVM address: ${address}`)
    }
    return address as Address
}

export const validateAndNormalizeAddress = (address: string): Address => {
    const normalizedAddress = address.toLowerCase()
    return validateAddress(normalizedAddress)
}

export const shortenName = (username: string): string => {
    return validAddress.test(username) ? username.slice(0, 6) : username
}

export const shortenNamesInString = (string: string): string => {
    return string.replace(/0x[a-fA-F0-9]{40}/g, (username) => {
        return shortenName(username)
    })
}

export const getNativeTokenValueEvents = (interactions: Interaction[]): InteractionEvent[] => {
    const nativeTokenEvents = []

    for (const interaction of interactions) {
        for (const event of interaction.events) {
            if (event.nativeTokenTransfer) {
                nativeTokenEvents.push(event)
            }
        }
    }

    return nativeTokenEvents
}

export const getKeys = <T>(obj: T) => Object.keys(obj) as Array<keyof T>

export const getEntries = <T>(obj: T) => Object.entries(obj) as Array<[keyof T, any]>

export function filterABIs(unfilteredABIs: Record<string, ABI_ItemUnfiltered[]>): Record<Address, ABI_Item[]> {
    const filteredABIs: Record<Address, ABI_Item[]> = {}

    for (const [addressStr, unfilteredABI] of Object.entries(unfilteredABIs)) {
        const address = validateAndNormalizeAddress(addressStr)
        const abi = unfilteredABI.filter(({ type }) => type === 'function' || type === 'event') as ABI_Item[]
        filteredABIs[address] = abi
    }

    return filteredABIs
}
