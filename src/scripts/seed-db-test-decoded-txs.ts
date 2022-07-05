import { flattenTxHashes } from '../__tests__/testTxHashes'
import './setupEnv'
import getTranslator from 'utils/translator'

async function run() {
    const translator = await getTranslator()
    await translator.allDataFromTxHashArr(flattenTxHashes())
    process.exit(0)
}

run()
