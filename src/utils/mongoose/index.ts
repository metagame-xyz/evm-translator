import { connect } from 'mongoose'

import { ContractData } from 'interfaces'
import { ABI_Row } from 'interfaces/abi'

import { DatabaseInterface } from 'utils/DatabaseInterface'
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

    async getContractDataForManyContracts(contractAddresses: string[]): Promise<Record<string, ContractData | null>> {
        const obj: Record<string, ContractData | null> = {}
        for (let i = 0; i < contractAddresses.length; i++) {
            obj[contractAddresses[i]] = null
        }
        return Promise.resolve(obj)

        // try {
        //     const data = await ContractModel.find({ address: { $in: contractAddresses } })
        //     return data
        // } else {
        //     return null
        // }
    }

    async addOrUpdateManyContractData(contractDataArr: ContractData[]): Promise<void> {
        return Promise.resolve()
    }

    async addOrUpdateManyABI(abiArr: ABI_Row[]): Promise<void> {
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

            console.log(result)
        } catch (e) {
            console.log('mongoose error')
            console.log(e)
        }
    }

    async getABIsForHexSignature(hexSignature: string): Promise<ABI_Row[] | null> {
        return Promise.resolve(null)
    }
}
