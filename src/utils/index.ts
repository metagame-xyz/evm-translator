import collect from 'collect.js'
import { BigNumber } from 'ethers'
import { Address, Chain, Chains, Interpretation } from 'interfaces'
import traverse from 'traverse'

const ethereum: Chain = {
    EVM: true,
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    testnet: false,
    blockExplorerUrl: 'https://etherscan.io/',
    wethAdress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
}

const polygon: Chain = {
    EVM: true,
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    testnet: false,
    blockExplorerUrl: 'https://polygonscan.com/',
    wethAdress: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
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
    body: null,
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
        throw new Error(`Invalid address: ${address}`)
    }
    return address as Address
}

export const shortenName = (username: string): string => {
    return validAddress.test(username) ? username.slice(0, 6) : username
}

export const shortenNamesInString = (string: string): string => {
    return string.replace(/0x[a-fA-F0-9]{40}/g, (username) => {
        return shortenName(username)
    })
}
