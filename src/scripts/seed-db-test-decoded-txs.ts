import { flattenTxHashes } from '../__tests__/testTxHashes'
import getTranslator from '../utils/translator'
import './setupEnv'

async function run() {
    const translator = await getTranslator()
    await translator.allDataFromTxHashArr(flattenTxHashes())
    process.exit(0)
}

run()
