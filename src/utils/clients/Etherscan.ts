import { ABI_ItemUnfiltered, ABI_ItemUnfilteredZ } from 'interfaces/abi'

import { Fetcher } from 'utils'

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

function promiseAll(promises: Array<Promise<any>>, errors: any[]) {
    return Promise.all(
        promises.map((p) => {
            return p.catch((e) => {
                errors.push(e)
                return e
            })
        }),
    )
}

export default class Etherscan {
    baseUrl = 'https://api.etherscan.io/api'
    apiKey: string
    fetcher = new Fetcher(5)

    constructor(apiKey: string) {
        this.apiKey = apiKey
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

    static parseABIResponse(response: any): ABI_ItemUnfiltered[] {
        if (response.result == 'Contract source code not verified') {
            return []
        }

        if (response.status !== '1') {
            console.warn(`Etherscan API error: ${response.result}`)
            // throw new Error(`Etherscan API error: ${response.result}`)
            return []
        }

        const abiArray: any[] = JSON.parse(response.result)

        const abiArrayValidated = abiArray.map((fragment) => {
            return ABI_ItemUnfilteredZ.parse(fragment)
        })

        return abiArrayValidated
    }

    async getABI(contractAddress: string): Promise<ABI_ItemUnfiltered[]> {
        const response = await this.fetcher.fetch(this.createUrl(Etherscan.abiParams(contractAddress)))

        return Etherscan.parseABIResponse(response)
    }

    async getABIs(contractAddresses: string[]): Promise<Record<string, ABI_ItemUnfiltered[]>> {
        const ABIMap: Record<string, ABI_ItemUnfiltered[]> = {}

        const errors: any[] = []

        const abiPromises = contractAddresses.map((contractAddress) => {
            return this.fetcher.fetch(this.createUrl(Etherscan.abiParams(contractAddress)))
        })

        const abiResults = await promiseAll(abiPromises, errors)

        const abis = abiResults.map((abiResult) => Etherscan.parseABIResponse(abiResult))

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
