import { ABI_ItemUnfiltered, ABI_ItemUnfilteredZ } from 'interfaces/abi'

import { Fetcher, promiseAll } from 'utils'
import { LogData, logError } from 'utils/logging'

export const enum EtherscanServiceLevel {
    free = 5,
    standard = 10,
    advanced = 20,
    professional = 30,
}

export type SourceCodeObject = {
    SourceCode: string
    ABI: string
    ContractName: string
    CompilerVersion: string
    OptimizationUsed: string
    Runs: string
    ConstructorArguments: string
    EVMVersion: string
    Library: string
    LicenseType: string
    Proxy: string
    Implementation: string
    SwarmSource: string
}

export default class Etherscan {
    baseUrl = 'https://api.etherscan.io/api'
    apiKey: string
    fetcher: Fetcher

    constructor(apiKey: string, etherscanServiceLevel = EtherscanServiceLevel.free) {
        this.apiKey = apiKey
        this.fetcher = new Fetcher(etherscanServiceLevel)
    }

    createUrl(params: Record<string, any>): string {
        const url = new URL(this.baseUrl)
        url.searchParams.set('apikey', this.apiKey)
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value)
        })

        return url.toString()
    }

    static abiParams(contractAddress: string): Record<string, string> {
        return {
            module: 'contract',
            action: 'getabi',
            address: contractAddress,
        }
    }

    static parseABIResponse(response: any, address: string | null = null): ABI_ItemUnfiltered[] {
        if (response.result == 'Contract source code not verified') {
            return []
        }

        const logData: LogData = {
            address: address ?? '',
            function_name: 'parseABIResponse',
            extra: response,
        }

        if (response.status !== '1') {
            logError(logData, { message: response.result })
            // console.warn(`Etherscan API error: ${response.result}`)
            // throw new Error(`Etherscan API error: ${response.result}`)
            return []
        }

        const abiArray: any[] = JSON.parse(response.result)

        console.log('abiArray logan:', abiArray)

        const abiArrayValidated = abiArray
            .map((fragment) => {
                const parsed = ABI_ItemUnfilteredZ.safeParse(fragment)
                return parsed.success ? parsed.data : null
            })
            .filter((x) => x !== null) as ABI_ItemUnfiltered[]

        return abiArrayValidated
    }

    async getABI(contractAddress: string): Promise<ABI_ItemUnfiltered[]> {
        const response = await this.fetcher.fetch(this.createUrl(Etherscan.abiParams(contractAddress)))

        return Etherscan.parseABIResponse(response, contractAddress)
    }

    async getABIs(contractAddresses: string[]): Promise<Record<string, ABI_ItemUnfiltered[]>> {
        const ABIMap: Record<string, ABI_ItemUnfiltered[]> = {}

        const errors: any[] = []

        const abiPromises = contractAddresses.map((contractAddress) => {
            return this.fetcher.fetch(this.createUrl(Etherscan.abiParams(contractAddress)))
        })

        const abiResults = await promiseAll(abiPromises, errors)

        const abis = abiResults.map((abiResult, i) => Etherscan.parseABIResponse(abiResult, contractAddresses[i]))

        abis.forEach((abi, i) => {
            ABIMap[contractAddresses[i]] = abi
        })

        if (errors.length > 0) {
            console.warn('errors:', errors)
        }

        return ABIMap
    }

    async getSourceCode(contractAddress: string): Promise<SourceCodeObject> {
        const params = {
            module: 'contract',
            action: 'getsourcecode',
            address: contractAddress,
        }

        const response = await this.fetcher.fetch(this.createUrl(params))

        if (response.status !== '1') {
            throw new Error(`Etherscan API error bad status: ${response.result}`)
        }

        if (response.result[0].ABI === 'Contract source code not verified') {
            throw new Error(`Etherscan API error not verified: ${response.result.ABI}`)
        }

        return response.result[0]
    }
}
