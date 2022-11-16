import { ethAddress, proxyImplementationAddress } from './constants'
// import { logWarning } from './logging'
import { BaseProvider } from '@ethersproject/providers'
import { AlchemyProvider, Network } from 'alchemy-sdk'
import Bottleneck from 'bottleneck'
import collect from 'collect.js'
import { BigNumber } from 'ethers'
import { FormatTypes, Fragment, keccak256, toUtf8Bytes } from 'ethers/lib/utils'
import fetch, { Response } from 'node-fetch'
import traverse from 'traverse'

import { ABI_Item, ABI_ItemUnfiltered, ABI_Row, ABI_RowZ, ABI_Type } from 'interfaces/abi'
import { Interaction, InteractionEvent } from 'interfaces/decoded'
import { Action, AssetType, Interpretation } from 'interfaces/interpreted'
import { Chain, Chains, ChainSymbol } from 'interfaces/utils'
import { AddressZ } from 'interfaces/utils'

// Despite most contracts using Open Zeppelin's standard naming convention of "to, from, value", not all do. Most notably, DAI and WETH use "src, dst, wad". These are used rename the keys to match the standard (both for generic and contract-specific interpretations).
const toKeys = ['to', '_to', 'dst']
const fromKeys = ['from', '_from', 'src']
const valueKeys = ['value', 'wad', 'amount']
const toKey = 'to'
const fromKey = 'from'
const valueKey = 'value'

const ethereum: Chain = {
    EVM: true,
    id: 1,
    name: 'Ethereum',
    symbol: ChainSymbol.ETH,
    testnet: false,
    blockExplorerUrl: 'https://etherscan.io/',
    wethAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    usdcAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    usdtAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    daiAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
    nativeAssetAddress: ethAddress,
    alchemyNetworkString: Network.ETH_MAINNET,
}

const polygon: Chain = {
    EVM: true,
    id: 137,
    name: 'Polygon',
    symbol: ChainSymbol.MATIC,
    testnet: false,
    blockExplorerUrl: 'https://polygonscan.com/',
    wethAddress: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
    usdcAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    usdtAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    daiAddress: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
    nativeAssetAddress: ethAddress, // maybe they use the same one idk
    alchemyNetworkString: Network.MATIC_MAINNET,
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

export const getStablecoinOrNativeWrappedAddressesBySymbol = (symbol: string): string[] => {
    const chain = getChainBySymbol(symbol)
    return [chain.wethAddress, chain.usdcAddress, chain.usdtAddress, chain.daiAddress, chain.nativeAssetAddress]
}

// TODO hardcoded but should be a call to a db that checks the contractAddress's decimal()
export const getDecimals = (contractAddress: string, chain = chains.ethereum): number => {
    if (!contractAddress) return 18
    const address = contractAddress.toLowerCase()
    const hexAddress = '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39' // hack
    const wBTCAddress = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'

    if ([chain.usdcAddress, chain.usdtAddress, hexAddress].includes(address)) {
        return 6
    } else if (address === wBTCAddress) {
        return 8
    } else {
        return 18
    }
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

export class Fetcher {
    limiter: Bottleneck
    fetchDefaultOptions = {
        body: undefined,
    }

    constructor(perSecond = 100) {
        const maxConcurrent = perSecond
        const minTime = (1000 / perSecond) * 1.3
        this.limiter = new Bottleneck({ maxConcurrent, minTime })
    }

    scheduleRequest(url: string, options: Record<string, any> = this.fetchDefaultOptions): Promise<Response> {
        return this.limiter.schedule(() => fetch(url, options))
    }

    async fetch(url: string, options: Record<string, any> = fetchOptions) {
        let retry = 3
        while (retry > 0) {
            const response = await this.scheduleRequest(url, options)
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

export const retryProviderCall = async <T>(providerPromise: Promise<T>): Promise<Awaited<T>> => {
    let retry = 4
    const waitTimes = [0, 8000, 4000, 2000]
    let error = null
    while (retry > 0) {
        try {
            const data = await providerPromise
            return data
        } catch (err) {
            retry--
            // logWarning({ thrown_error: err }, `retries left: ${retry}`)
            if (retry === 0) {
                error = err
            } else {
                await sleep(waitTimes[retry])
            }
        }
    }
    throw error
}

export function getNativeValueTransferredForDoubleSidedTx(interpretation: Interpretation): string {
    const nativeValueSent = interpretation.assetsSent.find((asset) => asset.type === AssetType.native)?.amount || '0'
    const nativeValueReceived =
        interpretation.assetsReceived.find((asset) => asset.type === AssetType.native)?.amount || '0'

    if (
        interpretation.actions[0] == 'bought' &&
        parseFloat(nativeValueReceived) === 0 &&
        parseFloat(nativeValueSent) !== 0
    ) {
        return nativeValueSent
    } else if (
        interpretation.actions[0] == 'sold' &&
        parseFloat(nativeValueSent) === 0 &&
        parseFloat(nativeValueReceived) !== 0
    ) {
        return nativeValueReceived
    } else {
        console.log(
            `Invalid NFT sale: action: ${interpretation.actions[0]}, received ${nativeValueReceived} ETH and ${interpretation.assetsReceived.length} tokens, sent ${nativeValueSent} ETH and ${interpretation.assetsSent.length} tokens`,
        )
        return Action.unknown
    }
}

export function fillDescriptionTemplate(template: string, interpretation: Interpretation): string {
    const merged: Record<string, any> = collect(interpretation.extra).merge(interpretation).all()
    // If transaction is 2-sided, we need to get sale price from either nativeValueSent or nativeValueReceived
    if (template.includes('__NATIVEVALUETRANSFERRED__')) {
        merged.__NATIVEVALUETRANSFERRED__ = getNativeValueTransferredForDoubleSidedTx(interpretation)
    }

    // Handle actions being an array --> simplify to a single action
    if (merged.actions.length > 1) {
        merged.action = Action.multicall
    } else if (merged.actions.length) {
        merged.action = merged.actions[0]
    } else {
        merged.action = Action.unknown
    }

    for (const [key, value] of Object.entries(merged)) {
        if (typeof value === 'string') {
            template = template.replace(`{${key}}`, value)
        }
    }
    return template
}

const validAddress = new RegExp(/^0x[a-fA-F0-9]{40}$/)

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
            if (event.nativeTransfer) {
                nativeTokenEvents.push(event)
            }
        }
    }

    return nativeTokenEvents
}

export const getKeys = (obj: Record<string, any>) => Object.keys(obj) as Array<string>

export const getEntries = <T>(obj: Record<string, T>) => Object.entries(obj) as Array<[string, T]>

export const getValues = <T>(obj: Record<string, T>) => Object.values(obj) as Array<T>

export function filterABI(unfilteredABI: ABI_ItemUnfiltered[]): ABI_Item[] {
    return unfilteredABI.filter(({ type }) => type === 'function' || type === 'event') as ABI_Item[]
}

export function filterABIMap(unfilteredABIs: Record<string, ABI_ItemUnfiltered[]>): Record<string, ABI_Item[]> {
    const filteredABIs: Record<string, ABI_Item[]> = {}

    for (const [address, unfilteredABI] of Object.entries(unfilteredABIs)) {
        const abi = filterABI(unfilteredABI)
        filteredABIs[address] = abi
    }

    return filteredABIs
}

export function filterABIArray(unfilteredABIs: ABI_ItemUnfiltered[]): ABI_Item[] {
    return unfilteredABIs.filter(
        ({ type }) => type === ABI_Type.enum.event || type === ABI_Type.enum.function,
    ) as ABI_Item[]
}

export function hash(data: string): string {
    return keccak256(toUtf8Bytes(data))
}

export function abiToAbiRow(abi: ABI_Item): ABI_Row {
    const frag = Fragment.from(abi)

    if (!frag) {
        console.log('No frag!', abi)
    }

    const hashed = hash(frag.format(FormatTypes.sighash))
    const signature = abi.type === ABI_Type.enum.event ? hashed : hashed.slice(0, 10)

    const abiRow = ABI_RowZ.parse({
        name: 'name' in abi ? abi.name : '',
        type: abi.type,
        hashableSignature: frag.format(FormatTypes.sighash),
        hashedSignature: signature,
        fullSignature: frag.format(FormatTypes.full),
        abiJSON: JSON.parse(frag.format(FormatTypes.json)),
    })
    return abiRow
}

export function abiArrToAbiRows(abiArr: ABI_Item[]): ABI_Row[] {
    return abiArr.map(abiToAbiRow)
}

export function promiseAll(promises: Array<Promise<any>>, errors: any[]) {
    return Promise.all(
        promises.map((p) => {
            return p.catch((e) => {
                errors.push(e)
                return e
            })
        }),
    )
}

export async function getProxyAddresses(provider: BaseProvider, addresses: string[]): Promise<Array<string | null>> {
    const proxyAddresses = await Promise.all(
        addresses.map((address) => {
            console.log('getProxyAddress', address)
            return provider.getStorageAt(address, proxyImplementationAddress).catch(() => null)
        }),
    )
    return proxyAddresses.map((proxyAddress) => {
        try {
            return AddressZ.parse(proxyAddress)
        } catch (e) {
            return null
        }
    })
}

export function toOrFromUser(event: InteractionEvent, direction: 'to' | 'from', userAddress: string) {
    const directionArr = direction === 'to' ? toKeys : fromKeys
    return directionArr.filter((key: string) => event.params[key] === userAddress).length > 0
}

// for example, DAI's Transfer event uses "dst" instead of "to", so we need to check for "dst" as well, even if the interpreter map uses "to". As we find more of these, we'll have to add them to the "toKeys" array. We mig
export function checkMultipleKeys(
    interactionEvent: InteractionEvent,
    key: string,
    valueToFind: string | null = null,
): any {
    if (!interactionEvent) {
        return valueToFind ? false : ''
    }
    const keyMapping: Record<string, string[]> = {
        [toKey]: toKeys,
        [fromKey]: fromKeys,
        [valueKey]: valueKeys,
    }

    const keys = keyMapping[key]

    if (keys) {
        for (const keyToCheck of keys) {
            if (valueToFind && interactionEvent.params[keyToCheck] === valueToFind) {
                return true
            } else if (!valueToFind && interactionEvent.params[keyToCheck]) {
                return interactionEvent.params[keyToCheck]
            }
        }
    }

    return valueToFind ? false : ''
}

export function flattenEventsFromInteractions(filteredInteractions: Interaction[]): InteractionEvent[] {
    return filteredInteractions.reduce((prev: InteractionEvent[], cur: Interaction): InteractionEvent[] => {
        return [...prev, ...cur.events]
    }, [])
}
