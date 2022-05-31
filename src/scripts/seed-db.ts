import { ABI_Item, ABI_ItemUnfiltered } from 'interfaces/abi'

import { abiArrToAbiRows, filterABI } from 'utils'
import erc20 from 'utils/ABIs/erc20.json'
import erc721 from 'utils/ABIs/erc721.json'
import { MongooseDatabaseInterface } from 'utils/mongoose'

async function run() {
    const db = new MongooseDatabaseInterface('mongodb://localhost:27017/evm-translator')
    await db.connect()

    const erc20rows = abiArrToAbiRows(filterABI(erc20 as ABI_ItemUnfiltered[]) as ABI_Item[])
    const erc721rows = abiArrToAbiRows(filterABI(erc721 as ABI_ItemUnfiltered[]) as ABI_Item[])

    const erc20rowsWithDefaults = erc20rows.map((row) => {
        row.default = true
        return row
    })
    const erc721rowsWithDefaults = erc721rows.map((row) => {
        row.default = true
        return row
    })

    await db.addOrUpdateManyABI(erc20rowsWithDefaults)
    await db.addOrUpdateManyABI(erc721rowsWithDefaults)

    console.log('done')
    process.exit(0)
}

run()
