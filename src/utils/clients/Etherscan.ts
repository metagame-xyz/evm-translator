import { Address } from 'interfaces'
import { fetcher } from 'utils'

export default class Etherscan {
    baseUrl = 'https://api.etherscan.io/api'
    apiKey: string

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

    async getABI(contractAddress: Address): Promise<string> {
        const params = {
            module: 'contract',
            action: 'getabi',
            address: contractAddress,
        }
        const response = await fetcher(this.createUrl(params))

        if (response.status !== '1') {
            throw new Error(`Etherscan API error: ${response.result}`)
        }

        return response.result
    }
}
