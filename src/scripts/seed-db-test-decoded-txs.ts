import { MongooseDatabaseInterface } from 'utils/mongoose'
import { flattenTxHashes } from '../__tests__/testTxHashes'
import dotenv from 'dotenv'
dotenv.config()

import getTranslator from '../utils/translator';

async function run() {
  const db = new MongooseDatabaseInterface('mongodb://localhost:27017/evm-translator')
  await db.connect()
  const translator = await getTranslator()
  await translator.allDataFromTxHashArr(flattenTxHashes());
  process.exit(0)
}

run()
