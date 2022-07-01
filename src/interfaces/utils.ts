import { BigNumber } from 'ethers'
import { z } from 'zod'

export const addressRegex = new RegExp(/^0x[a-fA-F0-9]{40}$/)
export const hashRegex = new RegExp(/^0x[a-fA-F0-9]*$/)
export const toLowercaseFn = (x: string) => x.toLowerCase()

export const multicallFunctionNames = ['multicall']
export const multicallContractAddresses = ['0xc36442b4a4522e871399cd717abdd847ab11fe88']
export const number = z.number()
export const int = z.number().int()
export const nullableInt = number.int().nullable()
export const string = z.string()
export const boolean = z.boolean()

export const AddressZ = z.string().regex(addressRegex).transform(toLowercaseFn)
export const optionalAddressZ = AddressZ.nullable()

export const HashZ = string.regex(hashRegex).transform(toLowercaseFn) // TODO is there a char count?

// export const BigNumberZ = string.transform((val) => BigNumber.from(val))
export const BigNumberZ = z
    .preprocess((val: any) => (typeof val == 'string' ? val : val.toString()), string)
    .transform((val) => BigNumber.from(val))
export const OptionalBigNumberZ = BigNumberZ.optional()

export const functionSchema = z.function().args(AddressZ).returns(AddressZ)

export const enum ChainSymbol {
    ETH = 'ETH',
    MATIC = 'MATIC',
}

export type Chain = {
    /** If this transaction is from an EVM-compatible chain. This it true for all, currently */
    EVM: boolean
    /** The chain's id. ETH=1, MATIC=137 */
    id: number
    /** The chain's colloquial name. Ethereum, Polygon */
    name: string
    /** The chain's symbol. ETH, MATIC */
    symbol: ChainSymbol
    /** If this chain is a testnet. */
    testnet: boolean
    /** The block explorer URL for this chain. https://etherscan.io/ */
    blockExplorerUrl: string
    /** The singleton contract address for the wrapped version of the native token. Need to change the variable name */
    wethAddress: string
    /** The singleton contract address for USDC */
    usdcAddress: string
    /** The singleton contract address for USDT */
    usdtAddress: string
    /** The singleton contract address for DAI */
    daiAddress: string
}
/** Map of EVM chain names to an object with Chain metadata */
export type Chains = Record<string, Chain>
