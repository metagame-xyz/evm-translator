import { BigNumber } from 'ethers'
import { z } from 'zod'

export const addressRegex = new RegExp(/^0x[a-fA-F0-9]{40}$/)
export const hashRegex = new RegExp(/^0x[a-fA-F0-9]+$/)
export const toLowercaseFn = (x: string) => x.toLowerCase()

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
