import { AbiCoder as EthersAbiCoder } from 'ethers/lib/utils'

const ethersAbiCoder = new EthersAbiCoder(function (type, value) {
    if (
        type.match(/^u?int/) &&
        !Array.isArray(value) &&
        (!(!!value && typeof value === 'object') || value.constructor.name !== 'BigNumber')
    ) {
        return value.toString()
    }
    return value
})

export default class ABICoder {
    mapTypes(types: any): any {
        const mappedTypes: any[] = []
        types.forEach((type: any) => {
            // Remap `function` type params to bytes24 since Ethers does not
            // recognize former type. Solidity docs say `Function` is a bytes24
            // encoding the contract address followed by the function selector hash.
            if (typeof type === 'object' && type.type === 'function') {
                type = Object.assign({}, type, { type: 'bytes24' })
            }
            if (this.isSimplifiedStructFormat(type)) {
                const structName = Object.keys(type)[0]
                mappedTypes.push(
                    Object.assign(this.mapStructNameAndType(structName), {
                        components: this.mapStructToCoderFormat(type[structName]),
                    }),
                )
                return
            }
            mappedTypes.push(type)
        })
        return mappedTypes
    }

    isSimplifiedStructFormat(type: string | { components: any; name: any }): boolean {
        return typeof type === 'object' && typeof type.components === 'undefined' && typeof type.name === 'undefined'
    }

    mapStructNameAndType(structName: string): { type: string; name: any } {
        let type = 'tuple'
        if (structName.indexOf('[]') > -1) {
            type = 'tuple[]'
            structName = structName.slice(0, -2)
        }
        return { type: type, name: structName }
    }

    mapStructToCoderFormat(struct: any): any[] {
        const components: any[] = []
        Object.keys(struct).forEach((key) => {
            if (typeof struct[key] === 'object') {
                components.push(
                    Object.assign(this.mapStructNameAndType(key), {
                        components: this.mapStructToCoderFormat(struct[key]),
                    }),
                )
                return
            }
            components.push({
                name: key,
                type: struct[key],
            })
        })
        return components
    }

    decodeParameters(outputs: any, bytes: any): any {
        if (outputs.length > 0 && (!bytes || bytes === '0x' || bytes === '0X')) {
            throw new Error(
                "Returned values aren't valid, did it run Out of Gas? " +
                    'You might also see this error if you are not using the ' +
                    'correct ABI for the contract you are retrieving data from, ' +
                    'requesting data from a block number that does not exist, ' +
                    'or querying a node which is not fully synced.',
            )
        }
        const res = ethersAbiCoder.decode(this.mapTypes(outputs), '0x' + bytes.replace(/0x/i, ''), false)
        const returnValue: Record<string, any> = {}
        outputs.forEach((output: any, i: number) => {
            let decodedValue = res[Object.keys(returnValue).length]
            const isStringObject = typeof output === 'object' && output.type && output.type === 'string'
            const isStringType = typeof output === 'string' && output === 'string'
            // only convert `0x` to null if it's not string value
            decodedValue = decodedValue === '0x' && !isStringObject && !isStringType ? null : decodedValue
            returnValue[i] = decodedValue

            // WARNING: don't think we need this for our uses, it was causing the object to have more keys than we expected, so we commented it out.
            // if ((typeof output === 'function' || (!!output && typeof output === 'object')) && output.name) {
            //     returnValue[output.name] = decodedValue
            // }
        })
        return returnValue
    }
}
