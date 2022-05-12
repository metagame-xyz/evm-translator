import { Log } from '@ethersproject/providers'
import ethers, { BigNumber, utils } from 'ethers'
import { DecodedCallData, RawDecodedCallData, RawDecodedLog, RawDecodedLogEvent } from 'interfaces'
import { ABI_Event, ABI_EventInput, ABI_FunctionInput, ABI_Item } from 'interfaces/abi'
import ABICoder from 'utils/web3-abi-coder'

function hash(data: string): string {
    return utils.keccak256(utils.toUtf8Bytes(data))
}

const abiCoder = new ABICoder()

type State = {
    savedABIs: any[]
    methodIDs: { [key: string]: ABI_Item }
}

const state: State = {
    savedABIs: [],
    methodIDs: {},
}

function _getABIs() {
    return state.savedABIs
}

function _typeToString(input: any) {
    if (input.type === 'tuple' && input.components) {
        return '(' + input.components?.map(_typeToString).join(',') + ')'
    }
    return input.type
}

function _addABI(abiArray: ABI_Item[]) {
    if (Array.isArray(abiArray)) {
        // Iterate new abi to generate method id"s
        abiArray.map(function (abi) {
            if (abi.name) {
                const signature = hash(abi.name + '(' + abi.inputs.map(_typeToString).join(',') + ')') as string
                if (abi.type === 'event') {
                    state.methodIDs[signature.slice(2)] = abi
                } else {
                    state.methodIDs[signature.slice(2, 10)] = abi
                }
            }
        })

        state.savedABIs = state.savedABIs.concat(abiArray)
    } else {
        throw new Error('Expected ABI array, got ' + typeof abiArray)
    }
}

function _removeABI(abiArray: ABI_Item[]) {
    if (Array.isArray(abiArray)) {
        // Iterate new abi to generate method id"s
        abiArray.map(function (abi) {
            if (abi.name) {
                const signature = hash(
                    abi.name +
                        '(' +
                        abi.inputs
                            .map(function (input) {
                                return input.type
                            })
                            .join(',') +
                        ')',
                ) as string
                if (abi.type === 'event') {
                    if (state.methodIDs[signature.slice(2)]) {
                        delete state.methodIDs[signature.slice(2)]
                    }
                } else {
                    if (state.methodIDs[signature.slice(2, 10)]) {
                        delete state.methodIDs[signature.slice(2, 10)]
                    }
                }
            }
        })
    } else {
        throw new Error('Expected ABI array, got ' + typeof abiArray)
    }
}

function _getMethodIDs() {
    return state.methodIDs
}

function _decodeMethod(data: string): RawDecodedCallData {
    const methodID = data.slice(2, 10)
    const abiItem = state.methodIDs[methodID]
    if (abiItem) {
        const decoded = abiCoder.decodeParameters(abiItem.inputs, data.slice(10))

        const retData: RawDecodedCallData = {
            name: abiItem.name,
            params: [],
        }

        for (let i = 0; i < Object.keys(decoded).length; i++) {
            // for (let i = 0; i < decoded.__length__; i++) {
            const param = decoded[i]
            let parsedParam = param
            const isUint = abiItem.inputs[i].type.indexOf('uint') === 0
            const isInt = abiItem.inputs[i].type.indexOf('int') === 0
            const isAddress = abiItem.inputs[i].type.indexOf('address') === 0

            if (isUint || isInt) {
                const isArray = Array.isArray(param)

                if (isArray) {
                    parsedParam = param.map((val) => BigNumber.from(val).toString())
                } else {
                    parsedParam = param ? BigNumber.from(param).toString() : null
                }
            }

            // Addresses returned by web3 are randomly cased so we need to standardize and lowercase all
            if (isAddress) {
                const isArray = Array.isArray(param)

                if (isArray) {
                    parsedParam = param.map((_) => _.toLowerCase())
                } else {
                    parsedParam = param.toLowerCase()
                }
            }

            retData.params.push({
                name: abiItem.inputs[i].name,
                value: parsedParam,
                type: abiItem.inputs[i].type,
            })
        }

        return retData
    } else {
        return {
            name: null,
            params: [],
        }
    }
}

function _decodeLogs(logs: Log[]): RawDecodedLog[] {
    return logs
        .filter((log) => log.topics.length > 0)
        .map((logItem) => {
            const methodID = logItem.topics[0].slice(2)
            const method = state.methodIDs[methodID] as ABI_Event
            if (method) {
                const logData = logItem.data
                const decodedParams: RawDecodedLogEvent[] = []
                let dataIndex = 0
                let topicsIndex = 1

                const dataTypes: any[] = []
                method.inputs.map(function (input) {
                    if (!input.indexed) {
                        dataTypes.push(input.type)
                    }
                })

                const decodedData = abiCoder.decodeParameters(dataTypes, logData.slice(2))

                type DecodedParam = {
                    name: string
                    value: string | BigNumber
                    type: string
                }

                type DecodedParamStringOnly = {
                    name: string
                    value: string
                    type: string
                }

                // Loop topic and data to get the params
                method.inputs.map(function (param) {
                    const decodedP: DecodedParam = {
                        name: param.name,
                        type: param.type,
                        value: '',
                    }

                    if (param.indexed) {
                        decodedP.value = logItem.topics[topicsIndex]
                        topicsIndex++
                    } else {
                        decodedP.value = decodedData[dataIndex]
                        dataIndex++
                    }

                    if (param.type === 'address' && typeof decodedP.value === 'string') {
                        decodedP.value = decodedP.value.toLowerCase()
                        // 42 because len(0x) + 40
                        if (decodedP.value.length > 42) {
                            const toRemove = decodedP.value.length - 42
                            const temp = decodedP.value.split('')
                            temp.splice(2, toRemove)
                            decodedP.value = temp.join('')
                        }
                    }

                    if (param.type === 'uint256' || param.type === 'uint8' || param.type === 'int') {
                        if (typeof decodedP.value === 'string') {
                            decodedP.value = BigNumber.from(decodedP.value).toString()
                        } else {
                            decodedP.value = decodedP.value.toString()
                        }
                    }

                    decodedParams.push(decodedP as DecodedParamStringOnly)
                })

                return {
                    name: method.name,
                    events: decodedParams,
                    address: logItem.address,
                    logIndex: logItem.logIndex,
                    decoded: true,
                } as RawDecodedLog
            } else {
                return {
                    name: null,
                    events: [],
                    address: logItem.address,
                    logIndex: logItem.logIndex,
                    decoded: false,
                } as RawDecodedLog
            }
        })
}

export default {
    getABIs: _getABIs,
    addABI: _addABI,
    getMethodIDs: _getMethodIDs,
    decodeMethod: _decodeMethod,
    decodeLogs: _decodeLogs,
    removeABI: _removeABI,
}
