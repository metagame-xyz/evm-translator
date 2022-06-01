import fourByteDirectory from './clients/FourByteDirectory'
import { DatabaseInterface } from './DatabaseInterface'
import { Log } from '@ethersproject/providers'
import { BigNumber } from 'ethers'

import { ContractData, ContractType, RawDecodedCallData, RawDecodedLog, RawDecodedLogEvent } from 'interfaces'
import { ABI_Event, ABI_Function, ABI_FunctionZ, ABI_Item, ABI_Row, ABI_Type } from 'interfaces/abi'
import { AddressZ } from 'interfaces/utils'

import { abiToAbiRow, hash } from 'utils'
import erc20 from 'utils/ABIs/erc20.json'
import erc721 from 'utils/ABIs/erc721.json'
import ABICoder from 'utils/web3-abi-coder'

const transferHash = hash('Transfer(address,address,uint256)')
const approvalHash = hash('Approval(address,address,uint256)')

function getABIForTransferEvent(contractType: ContractType | null): ABI_Event | null {
    switch (contractType) {
        case ContractType.ERC20:
            return erc20.find((abi) => abi.name === 'Transfer') as ABI_Event
        case ContractType.ERC721:
            return erc721.find((abi) => abi.name === 'Transfer') as ABI_Event
        default:
            return null
    }
}
function getABIForApprovalEvent(contractType: ContractType | null): ABI_Event | null {
    switch (contractType) {
        case ContractType.ERC20:
            return erc20.find((abi) => abi.name === 'Approval') as ABI_Event
        case ContractType.ERC721:
            return erc721.find((abi) => abi.name === 'Approval') as ABI_Event
        default:
            return null
    }
}

const abiCoder = new ABICoder()

export default class ABIDecoder {
    savedABIs: any[]
    methodSigs: { [key: string]: ABI_Function }
    eventSigs: { [key: string]: ABI_Event }
    abiRows: ABI_Row[]
    db: DatabaseInterface

    constructor(databaseInterface: DatabaseInterface) {
        this.savedABIs = []
        this.methodSigs = {}
        this.eventSigs = {}
        this.abiRows = []
        this.db = databaseInterface
    }
    getABIs() {
        return this.savedABIs
    }
    addABI(abiArray: ABI_Item[]) {
        abiArray.map((abi) => {
            const abiRow = abiToAbiRow(abi)
            this.abiRows.push(abiRow)

            if (abiRow.type === ABI_Type.enum.event) {
                this.eventSigs[abiRow.hashedSignature] = abiRow.abiJSON
            } else if (abiRow.type === ABI_Type.enum.function) {
                this.methodSigs[abiRow.hashedSignature] = abiRow.abiJSON
            }
        })

        this.savedABIs = this.savedABIs.concat(abiArray)
    }
    getMethodIDs() {
        return this.methodSigs
    }
    async getABIEventFromExternalSource(hexSignature: string): Promise<ABI_Event | undefined> {
        const abiSig = await fourByteDirectory.getEventSignature(hexSignature)

        console.log('abiSig', abiSig)
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

        // TODO shouldn't just be grabbing index 0
        // const abiItem = this.methodSigs[methodID] || (await this.db.getABIsForHexSignature(methodID))?.[0]
        // const abiItem = this.methodSigs[methodID] || (await this.getABIFunctionFromExternalSource(methodID))
        // const abiItem = await this.getABIFunctionFromExternalSource(methodID)
        const dbResult = await this.db.getFirstABIForHexSignature(methodID)
        const abiItem = dbResult ? ABI_FunctionZ.parse(dbResult) : null

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
                    name: abiItem.inputs[i].name || '',
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
    async decodeLogs(logs: Log[], contractDataMap: Record<string, ContractData>): Promise<RawDecodedLog[]> {
        return await Promise.all(
            logs
                .filter((log) => log.topics.length > 0)
                .map(async (logItem) => {
                    const eventID = logItem.topics[0]

                    // first check if it the contract's abi has it
                    let abiItem: ABI_Event | null = this.eventSigs[eventID] || null

                    // if it's there, add it as an option
                    let abiItemOptions: ABI_Event[] = abiItem ? [abiItem] : []

                    // if not, and it's the ambiguous Transfer event, check the contract type
                    if (!abiItem && eventID === transferHash) {
                        abiItem = getABIForTransferEvent(contractDataMap[AddressZ.parse(logItem.address)]?.type)
                    }

                    if (!abiItem && eventID === approvalHash) {
                        abiItem = getABIForApprovalEvent(contractDataMap[AddressZ.parse(logItem.address)]?.type)
                    }

                    // if not, check if we have any matches in the database
                    if (!abiItem) {
                        abiItemOptions = (await this.db.getEventABIsForHexSignature(eventID)) || []
                        // abiItem = abiItemOptions?.[0] || null
                    }

                    // console.log('eventId', eventID)
                    // console.log('logItem', logItem)
                    // console.log('abiItem', abiItem)

                    let decodedData: any = null
                    let dataIndex = 0
                    let topicsIndex = 1

                    function getDecodedData(logItem: Log, abiItem: ABI_Event) {
                        const logData = logItem.data.slice(2)

                        const dataTypes: any[] = []
                        abiItem.inputs.map(function (input) {
                            if (!input.indexed) {
                                dataTypes.push(input.type)
                            }
                        })
                        return abiCoder.decodeParameters(dataTypes, logData)
                    }

                    // if we found any matches, try to decode
                    if (abiItem) {
                        try {
                            decodedData = getDecodedData(logItem, abiItem)
                        } catch (e) {
                            console.warn(`the single abi didn't fit, looping thru options`, abiItem.name)
                        }
                    } else if (abiItemOptions.length > 0) {
                        // try all of the options, it'll throw an error if it doesn't match, catch it, try the next one
                        while (!decodedData && abiItemOptions.length > 0) {
                            abiItem = abiItemOptions.shift() as ABI_Event
                            try {
                                decodedData = getDecodedData(logItem, abiItem)
                            } catch (e) {
                                console.warn(`the first abi didn't fit, looping thru options`, abiItem.name)
                            }
                        }
                    }

                    if (abiItem && decodedData) {
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

                        const decodedParams: RawDecodedLogEvent[] = []
                        // Loop topic and data to get the params
                        abiItem.inputs.map(function (param) {
                            const decodedP: DecodedParam = {
                                name: param.name || '',
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
                            events: decodedParams,
                            name: abiItem.name,
                            address: AddressZ.parse(logItem.address),
                            logIndex: logItem.logIndex,
                            decoded: true,
                        } as RawDecodedLog
                    } else {
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
}
