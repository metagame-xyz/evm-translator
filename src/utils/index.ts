import { BigNumber } from 'ethers'
import { Chain, Chains } from 'interfaces'
import traverse from 'traverse'

const ethereum: Chain = {
    EVM: true,
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    testnet: false,
    blockExplorerUrl: 'https://etherscan.io/',
}

export const chains: Chains = {
    ethereum,
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
