import { AddressNameModel } from './models/addressName'
import { ContractModel } from './models/contract'
import { DecodedTxModel } from './models/decodedTx'
import { BulkResult } from 'mongodb'
import { connect, connection, Document, Types } from 'mongoose'

import {
    ABI_Event,
    ABI_EventZ,
    ABI_Function,
    ABI_FunctionZ,
    ABI_ItemUnfiltered,
    ABI_Row,
    ABI_RowZ,
    ABI_Type,
} from 'interfaces/abi'
import { AddressNameData, ContractData, DecodedTx } from 'interfaces/decoded'

import { DatabaseInterface } from 'utils/DatabaseInterface'
import { logInfo } from 'utils/logging'
import { ABI_RowModel } from 'utils/mongoose/models/abi'

export class MongooseDatabaseInterface extends DatabaseInterface {
    connectionString: string

    constructor(connectionString: string) {
        super()
        this.connectionString = connectionString
    }
    async connect() {
        // TODO
        // mongoose.connect('mongodb://user:pass@localhost:port/database', { autoIndex: false }); for PROD
        await connect(this.connectionString)
    }

    async getManyContractDataMap(contractAddresses: string[]): Promise<Record<string, ContractData | null>> {
        const contractMap: Record<string, ContractData | null> = {}
        for (let i = 0; i < contractAddresses.length; i++) {
            contractMap[contractAddresses[i]] = null
        }

        try {
            const modelData = await ContractModel.find({ address: { $in: contractAddresses } })
            const data = modelData.map((model) => model.toObject())

            for (let i = 0; i < contractAddresses.length; i++) {
                const contractAddress = contractAddresses[i]
                const contractData = data.find((contract) => contract.address === contractAddress)
                contractMap[contractAddress] = contractData || null
            }
        } catch (e) {
            console.log('get contract mongoose error')
            console.log(e)
            // return null
        }
        // return here instead of in the try, so that it still works if the db is down
        return contractMap
    }

    async addOrUpdateManyContractData(contractDataArr: ContractData[]): Promise<void> {
        try {
            // only way to do bulk upsert
            const { result } = await ContractModel.bulkWrite(
                contractDataArr.map((contract) => ({
                    updateOne: {
                        filter: { address: contract.address },
                        update: contract,
                        upsert: true,
                    },
                })),
            )
        } catch (e) {
            console.log('contract mongoose error')
            console.log(e)
        }
    }

    async addOrUpdateManyABI(abiArr: ABI_Row[]): Promise<BulkResult> {
        // prob don'`t need these 3 lines but might it optimize the writes
        const uniqueABIsAsStrings = new Set<string>()
        abiArr.map((abi) => uniqueABIsAsStrings.add(JSON.stringify(abi)))
        const uniqueABIs = Array.from(uniqueABIsAsStrings).map((str) => JSON.parse(str))

        try {
            // only way to do bulk upsert
            const { result } = await ABI_RowModel.bulkWrite(
                uniqueABIs.map((abi) => ({
                    updateOne: {
                        filter: { hashedSignature: abi.hashedSignature, fullSignature: abi.fullSignature },
                        update: abi,
                        upsert: true,
                    },
                })),
            )

            logInfo({}, `Added ${result.nUpserted} ABIs`)
            return result
        } catch (e) {
            console.log('abi mongoose error')
            console.log(e)
            throw e
        }
    }

    async getABIsForHexSignature(hexSignature: string): Promise<ABI_ItemUnfiltered[]> {
        const abiModels = await ABI_RowModel.find({ hashedSignature: hexSignature })
        const abis = abiModels.map((abi) => ABI_RowZ.parse(abi.toObject()))
        return abis.map((abi) => abi.abiJSON)
    }
    async getFirstABIForHexSignature(hexSignature: string): Promise<ABI_ItemUnfiltered | null> {
        const abis = (await this.getABIsForHexSignature(hexSignature)) || []
        return abis.length ? abis[0] : null
    }

    async getEventABIsForHexSignature(hexSignature: string): Promise<ABI_Event[]> {
        const abiModels = await ABI_RowModel.find({ hashedSignature: hexSignature })
        const abisRows = abiModels.map((abi) => ABI_RowZ.parse(abi.toObject()))
        abisRows.sort((a, b) => Number(b.default || false) - Number(a.default || false)) // get default(s) first
        const abis = abisRows.map((abi) => abi.abiJSON)
        const events = abis.filter((abi) => abi.type === ABI_Type.enum.event)
        return events.map((event) => ABI_EventZ.parse(event))
    }

    async getFunctionABIsForHexSignature(hexSignature: string): Promise<ABI_Function[]> {
        const abiModels = await ABI_RowModel.find({ hashedSignature: hexSignature })
        const abisRows = abiModels.map((abi) => ABI_RowZ.parse(abi.toObject()))
        abisRows.sort((a, b) => Number(b.default || false) - Number(a.default || false)) // get default(s) first
        const abis = abisRows.map((abi) => abi.abiJSON)
        const events = abis.filter((abi) => abi.type === ABI_Type.enum.function)
        return events.map((event) => ABI_FunctionZ.parse(event))
    }

    async addOrUpdateManyDecodedTx(decodedTxArr: DecodedTx[]): Promise<void> {
        try {
            // only way to do bulk upsert
            const { result } = await DecodedTxModel.bulkWrite(
                decodedTxArr.map((decodedTx) => ({
                    updateOne: {
                        filter: { txHash: decodedTx.txHash },
                        update: decodedTx,
                        upsert: true,
                    },
                })),
            )
        } catch (e) {
            console.log('decodedTx mongoose error')
            console.log(e)
        }
    }

    async getManyDecodedTxMap(txHashes: string[]): Promise<Record<string, DecodedTx | null>> {
        const decodedTxMap: Record<string, DecodedTx | null> = {}
        for (let i = 0; i < txHashes.length; i++) {
            decodedTxMap[txHashes[i]] = null
        }

        try {
            const modelData = await DecodedTxModel.find({ txHash: { $in: txHashes } })
            const data = modelData.map((model) => model.toObject())

            for (let i = 0; i < txHashes.length; i++) {
                const txHash = txHashes[i]
                const decodedTx = data.find((tx) => tx.txHash === txHash)
                decodedTxMap[txHash] = decodedTx || null
            }
        } catch (e) {
            console.log('get decodedTxs mongoose error')
            console.log(e)
            // return null
        }

        // return here instead of in the try, so that it still works if the db is down
        return decodedTxMap
    }

    async getContractsBatch(
        lastId: string,
        batchSize: number,
    ): Promise<(Document<unknown, any, ContractData> & ContractData & { _id: Types.ObjectId })[]> {
        try {
            const _id = new Types.ObjectId(lastId)
            const modelData = await ContractModel.find({ _id: { $gt: _id } }).limit(batchSize)
            return modelData
        } catch (e) {
            console.log('get contracts mongoose error')
            console.log(e)
            throw e
        }
    }

    async closeConnection() {
        connection.close()
    }

    async getManyNameDataMap(addresses: string[]): Promise<Record<string, AddressNameData | null>> {
        const nameMap: Record<string, AddressNameData | null> = {}
        for (let i = 0; i < addresses.length; i++) {
            nameMap[addresses[i]] = null
        }

        try {
            const modelData = await AddressNameModel.find({ address: { $in: addresses } })
            const data = modelData.map((model) => model.toObject())

            for (let i = 0; i < addresses.length; i++) {
                const address = addresses[i]
                const addressNameData = data.find((nameData) => nameData.address === address)
                nameMap[address] = addressNameData || null
            }
        } catch (e) {
            console.log('get nameMap mongoose error')
            console.log(e)
            // return null
        }
        // return here instead of in the try, so that it still works if the db is down
        return nameMap
    }

    async getEntityByAddress(address: string): Promise<string | null> {
        try {
            const modelData = await AddressNameModel.findOne({ address })
            return modelData ? modelData.toObject().entity : null
        } catch (e) {
            console.log('get nameByAddress mongoose error')
            console.log(e)
            throw e
        }
    }
}
