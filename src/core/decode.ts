import { transformCovalentEvents } from './transformCovalentLogs'
import { BaseProvider, Formatter } from '@ethersproject/providers'
import { Address, Decoded, InProgressActivity, Interaction, RawTxData, TX_TYPE } from '@interfaces'
import reverseRecords from 'ABIs/ReverseRecords.json'
import { normalize } from 'eth-ens-namehash'
import { Contract } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
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

export class Augmenter {
    provider: BaseProvider
    covalent: Covalent
    formatter = new Formatter()

    inProgressActivity!: InProgressActivity
    rawTxData!: RawTxData
    decoded: Decoded = { interactions: [] }

    covalentData?: CovalentTxData

    fnSigCache: Record<string, string> = {}
    ensCache: Record<Address, string> = {}

    constructor(provder: BaseProvider, covalent: Covalent) {
        this.provider = provder
        this.covalent = covalent
    }

    async decode(rawTxData: RawTxData): Promise<Decoded> {
        this.rawTxData = rawTxData
        this.augmentTxType()
        this.formatValuesNicely()
        if (this.decoded.txType === TX_TYPE.CONTRACT_INTERACTION) {
            await this.decodeMethodName()

            await this.getCovalentData()

            this.augmentOfficialContractName()

            this.augmentInteractionData()

            await this.augmentENSnames()
        }

        return this.decoded
    }

    private formatValuesNicely() {
        const value = this.rawTxData.transactionResponse.value.toString()
        const txReceipt = this.rawTxData.transactionReceipt

        const transformedData = {
            nativeTokenValueSent: value == '0' ? '0' : formatUnits(value),
            txIndex: txReceipt.transactionIndex,
            reverted: txReceipt.status == 0,
            gasUsed: txReceipt.gasUsed.toString(),
            effectiveGasPrice: txReceipt.effectiveGasPrice.toString(),
            fromAddress: txReceipt.from as Address,
            toAddress: txReceipt.to as Address,
        }

        this.decoded = { ...this.decoded, ...transformedData }
    }

    private async getCovalentData(): Promise<CovalentTxData> {
        const covalentRespose = await this.covalent.getTransactionFor(this.rawTxData.transactionResponse.hash)
        const covalentData = covalentRespose.items[0]
        this.covalentData = covalentData

        return covalentData
    }

    private augmentOfficialContractName() {
        let officalContractName = null

        if (this.covalentData) {
            officalContractName = this.covalentData.to_address_label
        } // can get it from contract JSON, maybe ABI, and/or TinTin too

        this.decoded.officialContractName = officalContractName
    }

    private augmentInteractionData() {
        let interactions: Interaction[] = []

        // we can get do this transformation with the ABI too. We can trust Covalent for now, but we already have a shim in there for ERC721s...
        if (this.covalentData) {
            interactions = transformCovalentEvents(this.covalentData)
        }

        this.decoded.interactions = interactions
    }

    private async augmentENSnames() {
        const ReverseRecords = new Contract(REVERSE_RECORDS_CONTRACT_ADDRESS, reverseRecords.abi, this.provider)

        // TODO use the ensCache

        async function getNames(addresses: string[]): Promise<string[]> {
            const allNames = await ReverseRecords.getNames(addresses)
            const validNames = allNames.filter((n: string) => normalize(n) === n)
            return validNames
        }

        const fromAndToAddresses = [this.rawTxData.transactionReceipt.from, this.rawTxData.transactionReceipt.to]
        const fromAndToNames = await getNames(fromAndToAddresses)

        this.decoded.fromENS = fromAndToNames[0] || null
        this.decoded.toENS = fromAndToNames[1] || null

        // TODO get all the ENS names in all the interactions and map them back on

        // const allAddresses = this.decoded.interactions
        //     ?.map((interaction) => interaction.events.map((event) => [event.from, event.to]))
        //     .flat(2)
        //     .filter((address) => !!address)

        // console.log('allAddresses', allAddresses)
    }

    private augmentTxType() {
        const { transactionReceipt, transactionResponse } = this.rawTxData

        let txType: TX_TYPE
        if (!transactionReceipt.to) {
            txType = TX_TYPE.CONTRACT_DEPLOY
        } else if (transactionResponse.data == '0x') {
            txType = TX_TYPE.TRANSFER
        } else {
            // TODO txReciept.contractAddress is the address of the contract created, add it
            txType = TX_TYPE.CONTRACT_INTERACTION
        }

        this.decoded.txType = txType
    }

    private async decodeMethodName() {
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
