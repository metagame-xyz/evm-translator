import { transformCovalentEvents } from './transformCovalentLogs'
import { BaseProvider, Formatter } from '@ethersproject/providers'
import { Decoded, InProgressActivity, RawTxData, TX_TYPE } from '@interfaces'
import reverseRecords from 'ABIs/ReverseRecords.json'
import { normalize } from 'eth-ens-namehash'
import { Contract } from 'ethers'
import { CovalentTxData } from 'interfaces/covalent'
import Covalent from 'utils/clients/Covalent'
import fourByteDirectory from 'utils/clients/FourByteDirectory'
import { REVERSE_RECORDS_CONTRACT_ADDRESS } from 'utils/constants'

export type DecoderConfig = {
    covalentData?: CovalentTxData
    useNodeForENS: boolean
    use4ByteDirectory: boolean
    useTinTin: boolean
}

// function augmentFromCovalent(decodedData: Decoded, rawTxData: RawTxDataOld, covalentData: CovalentTxData): Decoded {
//     const usefulCovalentData = {
//         officalContractName: covalentData.to_address_label,
//         nativeTokenValueSent: covalentData.value == '0' ? '0' : ethers.utils.formatUnits(covalentData.value),
//         reverted: !covalentData.successful,
//     }

//     decodedData = { ...decodedData }
//     return decodedData
// }

// export function decode(rawTxData: RawTxDataOld, config: DecoderConfig): Decoded {
//     let decodedData = {} as Decoded

//     if (config.covalentData) {
//         decodedData = augmentFromCovalent(decodedData, rawTxData, config.covalentData)
//     }

//     return decodedData
// }

export class Augmenter {
    provider: BaseProvider
    covalent: Covalent
    formatter = new Formatter()

    inProgressActivity!: InProgressActivity
    rawTxData!: RawTxData
    decoded: Decoded = {}

    covalentData?: CovalentTxData

    fnSigCache: Record<string, string> = {}

    constructor(provder: BaseProvider, covalent: Covalent) {
        this.provider = provder
        this.covalent = covalent
    }

    async decode(rawTxData: RawTxData): Promise<Decoded> {
        this.rawTxData = rawTxData
        this.augmentTxType()
        if (this.decoded.txType === TX_TYPE.CONTRACT_INTERACTION) {
            await this.decodeMethodName()

            await this.getCovalentData()

            this.augmentOfficialContractName()

            this.augmentInteractionData()

            await this.augmentENSnames()
        }

        return this.decoded
    }

    async getCovalentData(): Promise<CovalentTxData> {
        const covalentRespose = await this.covalent.getTransactionFor(this.rawTxData.transactionResponse.hash)
        const covalentData = covalentRespose.items[0]
        this.covalentData = covalentData

        return covalentData
    }

    augmentOfficialContractName() {
        let officalContractName = null

        if (this.covalentData) {
            officalContractName = this.covalentData.to_address_label
        } // can get it from contract JSON, maybe ABI, and/or TinTin too

        this.decoded.officialContractName = officalContractName
    }

    augmentInteractionData() {
        let interactions

        // we can get do this transformation with the ABI too. We can trust Covalent for now, but we already have a shim in there for ERC721s...
        if (this.covalentData) {
            interactions = transformCovalentEvents(this.covalentData)
        }

        this.decoded.interactions = interactions
    }

    async augmentENSnames() {
        const ReverseRecords = new Contract(REVERSE_RECORDS_CONTRACT_ADDRESS, reverseRecords.abi, this.provider)

        async function getNames(addresses: string[]): Promise<string[]> {
            const allNames = await ReverseRecords.getNames(addresses)
            const validNames = allNames.filter((n: string) => normalize(n) === n)
            return validNames
        }

        const fromAndToAddresses = [this.rawTxData.transactionReceipt.from, this.rawTxData.transactionReceipt.to]
        const fromAndToNames = await getNames(fromAndToAddresses)

        this.decoded.fromENS = fromAndToNames[0] || null
        this.decoded.toENS = fromAndToNames[1] || null

        // const allAddresses = this.decoded.interactions
        //     ?.map((interaction) => interaction.events.map((event) => [event.from, event.to]))
        //     .flat(2)
        //     .filter((address) => !!address)

        // console.log('allAddresses', allAddresses)
    }

    augmentTxType() {
        const { transactionReceipt, transactionResponse } = this.rawTxData

        let txType: TX_TYPE
        if (!transactionReceipt.to) {
            txType = TX_TYPE.CONTRACT_DEPLOY
        } else if (transactionResponse.data == '0x') {
            txType = TX_TYPE.TRANSFER
        } else {
            txType = TX_TYPE.CONTRACT_INTERACTION
        }

        this.decoded.txType = txType
    }

    async decodeMethodName() {
        // first try to get if from the contract-specific interpreter, or ABI

        let contractMethod = null

        const hexSignature = this.rawTxData.transactionResponse.data.slice(0, 10)
        if (this.fnSigCache[hexSignature]) {
            contractMethod = this.fnSigCache[hexSignature]
        } else {
            contractMethod = await fourByteDirectory.getMethodSignature(hexSignature)
            this.fnSigCache[hexSignature] = contractMethod
        }

        this.decoded.contractMethod = contractMethod
    }
}
