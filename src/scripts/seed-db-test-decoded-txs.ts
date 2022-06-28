import { flattenTxHashes } from '../__tests__/testTxHashes'
import getTranslator from '../utils/translator'
import dotenv from 'dotenv'

import { MongooseDatabaseInterface } from 'utils/mongoose'

dotenv.config()

async function run() {
    const db = new MongooseDatabaseInterface('mongodb://localhost:27017/evm-translator')
    await db.connect()
    const translator = await getTranslator()
    await translator.allDataFromTxHashArr(flattenTxHashes())
    process.exit(0)
}

run()
