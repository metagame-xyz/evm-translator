import fourByteDirectory from './clients/FourByteDirectory'
import { DatabaseInterface } from './DatabaseInterface'
import { Log } from '@ethersproject/providers'
import { BigNumber, utils } from 'ethers'

import { RawDecodedCallData, RawDecodedLog, RawDecodedLogEvent } from 'interfaces'
import { ABI_Event, ABI_Function, ABI_Item } from 'interfaces/abi'
import { AddressZ } from 'interfaces/utils'

import ABICoder from 'utils/web3-abi-coder'

function hash(data: string): string {
    return utils.keccak256(utils.toUtf8Bytes(data))
}

const abiCoder = new ABICoder()

export default class ABIDecoder {
    savedABIs: any[]
    methodSigs: { [key: string]: ABI_Function }
    eventSigs: { [key: string]: ABI_Event }
    db: DatabaseInterface

    constructor(databaseInterface: DatabaseInterface) {
        this.savedABIs = []
        this.methodSigs = {}
        this.eventSigs = {}
        this.db = databaseInterface
    }
    getABIs() {
        return this.savedABIs
    }
    static typeToString(input: any) {
        if (input.type === 'tuple' && input.components) {
            return '(' + input.components?.map(ABIDecoder.typeToString).join(',') + ')'
        }
        return input.type
    }
    addABI(abiArray: ABI_Item[]) {
        abiArray.map((abi) => {
            if (abi.name) {
                const signature = hash(
                    abi.name + '(' + abi.inputs.map(ABIDecoder.typeToString).join(',') + ')',
                ) as string
                if (abi.type === 'event') {
                    this.eventSigs[signature] = abi
                } else {
                    this.methodSigs[signature.slice(0, 10)] = abi
                }
            }
        })

        this.savedABIs = this.savedABIs.concat(abiArray)
    }
    removeABI(abiArray: ABI_Item[]) {
        // Iterate new abi to generate method id"s
        abiArray.map((abi) => {
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
                    if (this.methodSigs[signature]) {
                        delete this.methodSigs[signature]
                    }
                } else {
                    if (this.methodSigs[signature.slice(0, 10)]) {
                        delete this.methodSigs[signature.slice(0, 10)]
                    }
                }
            }
        })
    }
    getMethodIDs() {
        return this.methodSigs
    }

    async getABIEventFromExternalSource(hexSignature: string): Promise<ABI_Event | undefined> {
        const abiSig = await fourByteDirectory.getEventSignature(hexSignature)

        return abiSig
            ? {
                  name: abiSig,
                  type: 'event',
                  inputs: [],
                  anonymous: false,
              }
            : undefined
    }
    async getABIFunctionFromExternalSource(hexSignature: string): Promise<ABI_Function | undefined> {
        const contractMethod = await fourByteDirectory.getMethodSignature(hexSignature)

        return contractMethod
            ? {
                  name: contractMethod,
                  type: 'function',
                  inputs: [],
                  outputs: [],
                  stateMutability: undefined,
              }
            : undefined
    }

    async decodeMethod(data: string): Promise<RawDecodedCallData> {
        const methodID = data.slice(0, 10)

        const abiItem = this.methodSigs[methodID] || (await this.getABIFunctionFromExternalSource(methodID))
        // const abiItem = await this.getABIFunctionFromExternalSource(methodID)

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
    async decodeLogs(logs: Log[]): Promise<RawDecodedLog[]> {
        return await Promise.all(
            logs
                .filter((log) => log.topics.length > 0)
                .map(async (logItem) => {
                    const eventID = logItem.topics[0]
                    // const abiItem = this.eventSigs[eventID] || (await this.getABIEventFromExternalSource(eventID))
                    const abiItem = await this.getABIEventFromExternalSource(eventID)

                    console.log('abiItem', abiItem)

                    if (abiItem) {
                        const logData = logItem.data.slice(2)
                        const decodedParams: RawDecodedLogEvent[] = []
                        let dataIndex = 0
                        let topicsIndex = 1

                        const dataTypes: any[] = []
                        abiItem.inputs.map(function (input) {
                            if (!input.indexed) {
                                dataTypes.push(input.type)
                            }
                        })

                        const decodedData = abiCoder.decodeParameters(dataTypes, logData)

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
                        abiItem.inputs.map(function (param) {
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
                            name: abiItem.name,
                            events: decodedParams,
                            address: AddressZ.parse(logItem.address),
                            logIndex: logItem.logIndex,
                            decoded: true,
                        } as RawDecodedLog
                    } else {
                        // TODO call 4byte / db to
                        return {
                            name: null,
                            events: [],
                            address: AddressZ.parse(logItem.address),
                            logIndex: logItem.logIndex,
                            decoded: false,
                        } as RawDecodedLog
                    }
                }),
        )
    }
}
