import { transformCovalentEvents } from './transformCovalentLogs'
import { BaseProvider, Formatter } from '@ethersproject/providers'
import reverseRecords from 'ABIs/ReverseRecords.json'
import { normalize } from 'eth-ens-namehash'
import { Contract } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { Address, Decoded, InProgressActivity, RawTxData, TX_TYPE } from 'interfaces'
import { CovalentTxData } from 'interfaces/covalent'
import traverse from 'traverse'
import { isAddress } from 'utils'
import Covalent from 'utils/clients/Covalent'
import fourByteDirectory from 'utils/clients/FourByteDirectory'
import { REVERSE_RECORDS_CONTRACT_ADDRESS } from 'utils/constants'

export type DecoderConfig = {
    covalentData?: CovalentTxData
    useNodeForENS: boolean
    use4ByteDirectory: boolean
    useTinTin: boolean
}

export class Augmenter {
    provider: BaseProvider
    covalent: Covalent
    formatter = new Formatter()

    inProgressActivity!: InProgressActivity
    rawTxDataArr!: RawTxData[]
    decodedArr!: Decoded[]

    covalentData?: CovalentTxData
    covalentDataArr: CovalentTxData[] = []

    fnSigCache: Record<string, string> = {}
    ensCache: Record<Address, string> = {}

    constructor(provder: BaseProvider, covalent: Covalent) {
        this.provider = provder
        this.covalent = covalent
    }

    async decode(rawTxDataArr: RawTxData[], covalentTxDataArr: CovalentTxData[] = []): Promise<Decoded[]> {
        this.rawTxDataArr = rawTxDataArr
        this.covalentDataArr = covalentTxDataArr

        this.createDecodedArr()

        await this.decodeMethodNames()

        if (!this.covalentDataArr.length) {
            await this.getCovalentData()
        }

        this.augmentOfficialContractNames()
        this.augmentInteractionData()
        await this.augmentENSnames()

        return this.decodedArr
    }

    private createDecodedArr() {
        const formattedRawTxDataArr = this.rawTxDataArr.map((rawTxData) => {
            const { txReceipt, txResponse } = rawTxData
            const value = rawTxData.txResponse.value.toString()

            let txType: TX_TYPE
            if (!txReceipt.to) {
                txType = TX_TYPE.CONTRACT_DEPLOY
            } else if (txResponse.data == '0x') {
                txType = TX_TYPE.TRANSFER
            } else {
                // TODO txReciept.contractAddress is the address of the contract created, add it
                txType = TX_TYPE.CONTRACT_INTERACTION
            }

            const transformedData = {
                txType: txType,
                nativeTokenValueSent: value == '0' ? '0' : formatUnits(value),
                txIndex: txReceipt.transactionIndex,
                reverted: txReceipt.status == 0,
                gasUsed: txReceipt.gasUsed.toString(),
                effectiveGasPrice: txReceipt.effectiveGasPrice.toString(),
                fromAddress: txReceipt.from,
                toAddress: txReceipt.to,
                interactions: [],
            }

            return transformedData
        })

        this.decodedArr = formattedRawTxDataArr
    }

    private async getCovalentData(): Promise<void> {
        if (this.rawTxDataArr.length > 1) {
            throw new Error('Not implemented. This only happens if you already got raw data via Covalent')
        } else {
            const covalentRespose = await this.covalent.getTransactionFor(this.rawTxDataArr[0].txResponse.hash)
            const covalentData = covalentRespose.items[0]
            this.covalentDataArr.push(covalentData)
        }
    }

    private augmentOfficialContractNames() {
        // can get it from contract JSON, maybe ABI, and/or TinTin too
        if (this.covalentDataArr.length) {
            this.covalentDataArr.forEach((covalentData, index) => {
                this.decodedArr[index].officialContractName = covalentData.to_address_label || null
            })
        }
    }

    private augmentInteractionData() {
        // we can get do this transformation with the ABI too. We can trust Covalent for now, but we already have a shim in there for ERC721s...
        if (this.covalentDataArr.length) {
            this.covalentDataArr.forEach((covalentData, index) => {
                this.decodedArr[index].interactions = transformCovalentEvents(covalentData)
            })
        }
    }

    private async augmentENSnames(): Promise<void> {
        const ReverseRecords = new Contract(REVERSE_RECORDS_CONTRACT_ADDRESS, reverseRecords.abi, this.provider)

        async function getNames(addresses: string[]): Promise<string[]> {
            const allNames = await ReverseRecords.getNames(addresses)
            const validNames = allNames.filter((n: string) => normalize(n) === n)
            return validNames
        }

        const allAddresses: string[] = []

        traverse(this.decodedArr).forEach(function (value: any) {
            if (isAddress(value)) {
                allAddresses.push(value)
            }
        })

        // filter out duplicates
        const addresses = [...new Set(allAddresses)]

        const names = await getNames(addresses)

        let addressToNameMap: Record<string, string> = {}

        addresses.forEach((address, index) => {
            addressToNameMap[address] = names[index]
        })

        console.log('addressToNameMap', addressToNameMap)

        // filter out addresses:names with no names (most of them lol)
        addressToNameMap = Object.fromEntries(Object.entries(addressToNameMap).filter(([, v]) => v != ''))
        const decodedArrWithENS = traverse(this.decodedArr).map((thing) => {
            if (!!thing && typeof thing === 'object' && !Array.isArray(thing)) {
                for (const [key, val] of Object.entries(thing)) {
                    if (addressToNameMap[val as string]) {
                        thing[key + 'ENS'] = addressToNameMap[val as string]
                    }
                }
            }
        })

        this.decodedArr = decodedArrWithENS
    }

    private async decodeMethodName(rawTxData: RawTxData): Promise<string> {
        // first try to get if from the contract-specific interpreter, or ABI

        let contractMethod = null

        const hexSignature = rawTxData.txResponse.data.slice(0, 10)
        if (this.fnSigCache[hexSignature]) {
            contractMethod = this.fnSigCache[hexSignature]
        } else {
            contractMethod = await fourByteDirectory.getMethodSignature(hexSignature)
            this.fnSigCache[hexSignature] = contractMethod
        }

        return contractMethod
    }

    private async decodeMethodNames(): Promise<void> {
        const methodNames = await Promise.all(
            this.rawTxDataArr.map(async (rawTxData, index) => {
                let methodName = null
                if (this.decodedArr[index].txType !== TX_TYPE.TRANSFER) {
                    methodName = await this.decodeMethodName(rawTxData)
                }
                return methodName
            }),
        )

        methodNames.forEach((methodName, index) => {
            this.decodedArr[index].contractMethod = methodName
        })
    }
}
