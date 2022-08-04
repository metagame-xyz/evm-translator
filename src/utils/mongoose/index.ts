import { AddressNameModel } from './models/addressName'
import { ContractModel } from './models/contract'
import { DecodedTxModel } from './models/decodedTx'
import collect, { Collection } from 'collect.js'
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
    EventSigOptions,
} from 'interfaces/abi'
import { AddressNameData, ContractData, DecodedTx } from 'interfaces/decoded'

import { getEntries } from 'utils'
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
            await ContractModel.bulkWrite(
                contractDataArr.map((contract) => ({
                    updateOne: {
                        filter: { address: contract.address },
                        update: contract,
                        upsert: true,
                    },
                })),
            )
        } catch (e: any) {
            if (!e?.message?.includes('user is not allowed to do action [update]')) {
                console.log('contract mongoose error')
                console.log(e)
            }
        }
    }

    async addOrUpdateManyABI(abiArr: ABI_Row[]): Promise<boolean> {
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

            if (result.nUpserted > 0) {
                logInfo({}, `Added ${result.nUpserted} ABIs`)
            }
            return true
        } catch (e: any) {
            if (!e?.message?.includes('user is not allowed to do action [update]')) {
                console.log('abi mongoose error')
                console.log(e)
            }
            return false
            // throw e
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

    async getManyEventABIsForHexSignatures(hexSignatures: string[]): Promise<EventSigOptions> {
        const abiModels = await ABI_RowModel.find({ hashedSignature: { $in: hexSignatures } })
        const abisRows = abiModels.map((abi) => ABI_RowZ.parse(abi.toObject())) as ABI_Row[]
        abisRows.sort((a, b) => Number(b.default || false) - Number(a.default || false)) // get default(s) first
        const events = abisRows.filter((row) => row.type === ABI_Type.enum.event)
        const eventSigMap = collect(events)
            .mapToDictionary((row: ABI_Row) => [row.hashedSignature, row.abiJSON])
            .all()
        return eventSigMap
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
            await DecodedTxModel.bulkWrite(
                decodedTxArr.map((decodedTx) => ({
                    updateOne: {
                        filter: { txHash: decodedTx.txHash },
                        update: decodedTx,
                        upsert: true,
                    },
                })),
            )
        } catch (e: any) {
            if (!e?.message?.includes('user is not allowed to do action [update]')) {
                console.log('decodedTx mongoose error')
                console.log(e)
            }
        }
    }

    async deleteManyDecodedTxs(txHashes: string[]): Promise<number> {
        try {
            const { acknowledged, deletedCount } = await DecodedTxModel.deleteMany({ txHash: { $in: txHashes } })
            return acknowledged ? deletedCount : 0
        } catch (e: any) {
            if (!e?.message?.includes('user is not allowed to do action [delete]')) {
                console.log('decodedTx mongoose error')
                console.log(e)
            }
            return 0
        }
    }

    async getDecodedTxByMongoId(
        lastId: string,
        batchSize: number,
    ): Promise<(Document<unknown, any, DecodedTx> & DecodedTx & { _id: Types.ObjectId })[] | null> {
        try {
            const _id = new Types.ObjectId(lastId)
            const decodedTxs = await DecodedTxModel.find({ _id: { $gt: _id } }).limit(batchSize)
            // console.log(user)

            return decodedTxs
        } catch (err) {
            console.error('mongoose getUserByMongoId error', err)
            return null
        }
    }

    async getManyDecodedByAddress(address: string, maxAddresses = 50): Promise<DecodedTx[]> {
        try {
            // const decodedTxs = await DecodedTxModel.find({ allAddresses: address })
            const explain = await DecodedTxModel.find({
                allAddresses: address,
                [`allAddresses.${maxAddresses}`]: { $exists: false },
            })

            // console.log(explain.executionStats)
            return explain
        } catch (err) {
            console.error('mongoose getManyDecodedByAddress error', err)
            return []
        }
    }

    async getManyDecodedTxMap(txHashes: string[]): Promise<Record<string, DecodedTx | null>> {
        const decodedTxMap: Record<string, DecodedTx | null> = {}
        for (let i = 0; i < txHashes.length; i++) {
            decodedTxMap[txHashes[i]] = null
        }

        // hack for $in being n * log(m) where n = chunk.length and m = db size
        // to actually fix this we'd have to add an 'indexedAddress' column to the DecodedTxModel
        // and we'd probably just have multiple of the same decodedTx in the db in the case that multiple people were part of a tx
        const chunks = collect(txHashes)
            .chunk(128)
            .all()
            .map((chunk: any) => chunk.all())

        const promises = chunks.map((chunk) => {
            return DecodedTxModel.find({ txHash: { $in: chunk } })
        })

        try {
            const dataChunked = await Promise.all(promises)
            const modelData = dataChunked.reduce((acc, chunk) => acc.concat(chunk), [])
            // const modelData = await DecodedTxModel.find({ txHash: { $in: txHashes } })
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
    async getManyDecodedTxArr(txHashes: string[], maxAddresses = 50): Promise<DecodedTx[]> {
        let decodedTxArr = []

        // hack for $in being n * log(m) where n = chunk.length and m = db size
        // to actually fix this we'd have to add an 'indexedAddress' column to the DecodedTxModel
        // and we'd probably just have multiple of the same decodedTx in the db in the case that multiple people were part of a tx
        const chunks = collect(txHashes)
            .chunk(512)
            .all()
            .map((chunk: any) => chunk.all())

        const promises = chunks.map((chunk) => {
            return DecodedTxModel.find({ txHash: { $in: chunk }, [`allAddresses.${maxAddresses}`]: { $exists: false } })
        })

        try {
            const dataChunked = await Promise.all(promises)
            const modelData = dataChunked.reduce((acc, chunk) => acc.concat(chunk), [])
            // const modelData = await DecodedTxModel.find({ txHash: { $in: txHashes } })
            decodedTxArr = modelData.map((model) => model.toObject())
        } catch (e) {
            console.log('get decodedTxs mongoose error')
            console.log(e)
            // return null
        }

        // return here instead of in the try, so that it still works if the db is down
        return decodedTxArr
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

    async getManyEntityMap(addresses: string[]): Promise<Record<string, string | null>> {
        const nameDataMap = await this.getManyNameDataMap(addresses)

        const entityTuples = getEntries(nameDataMap).map(([address, nameData]) => [address, nameData?.entity || null])

        return Object.fromEntries(entityTuples)
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

// async getManyDecodedTxMap(txHashes: string[]): Promise<Record<string, DecodedTx | null>> {
//     const decodedTxMap: Record<string, DecodedTx | null> = {}
//     for (let i = 0; i < txHashes.length; i++) {
//         decodedTxMap[txHashes[i]] = null
//     }

//     // hack for $in being n * log(m) where n = chunk.length and m = db size
//     // to actually fix this we'd have to add an 'indexedAddress' column to the DecodedTxModel
//     // and we'd probably just have multiple of the same decodedTx in the db in the case that multiple people were part of a tx
//     const chunks = collect(txHashes)
//         .chunk(512)
//         .all()
//         .map((chunk: any) => chunk.all())

//     // const promises = chunks.map((chunk) => {
//     //     return DecodedTxModel.find({ txHash: { $in: chunk } })
//     // })
//     const dataChunked = []
//     for (let i = 0; i < chunks.length; i++) {
//         console.log('getting chunk', i)
//         const chunk = chunks[i]
//         const decodedTxs = await DecodedTxModel.find({ txHash: { $in: chunk } })
//         dataChunked.push(decodedTxs)
//     }

//     try {
//         // const dataChunked = await Promise.all(promises)
//         const modelData = dataChunked.reduce((acc, chunk) => acc.concat(chunk), [])
//         // const modelData = await DecodedTxModel.find({ txHash: { $in: txHashes } })
//         const data = modelData.map((model) => model.toObject())

//         for (let i = 0; i < txHashes.length; i++) {
//             const txHash = txHashes[i]
//             const decodedTx = data.find((tx) => tx.txHash === txHash)
//             decodedTxMap[txHash] = decodedTx || null
//         }
//     } catch (e) {
//         console.log('get decodedTxs mongoose error')
//         console.log(e)
//         // return null
//     }

//     // return here instead of in the try, so that it still works if the db is down
//     return decodedTxMap
// }
