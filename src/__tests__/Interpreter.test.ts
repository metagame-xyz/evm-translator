import testTxHashes, { flattenTxHashes } from '../__tests__/testTxHashes.js'
import Interpreter from '../core/Interpreter'
import { chains } from '../index'
import { DecodedTx } from '../interfaces/decoded'
import dotenv from 'dotenv'

import { MongooseDatabaseInterface } from 'utils/mongoose'

dotenv.config()

jest.mock('node-fetch', () => jest.fn())

jest.useRealTimers()

test('Interpreter', async () => {
    jest.setTimeout(200 * 1000)
    const db = new MongooseDatabaseInterface(process.env.EVM_TRANSLATOR_CONNECTION_STRING || '')
    await db.connect()
    const interpreter = new Interpreter(chains.ethereum)
    const txMap = await db.getManyDecodedTxMap(flattenTxHashes())
    const filteredDecodedTxes = Object.entries(txMap)
        .filter(([txHash, decodedTx]) => {
            if (!decodedTx) {
                console.log('Issue with decoder for tx:', txHash)
                return false
            }
            return true
        })
        .map(([, decodedTx]) => decodedTx)

    for (const decodedTx of filteredDecodedTxes) {
        expect(await interpreter.interpretSingleTx(decodedTx!)).toMatchSnapshot()
    }
    await db.closeConnection()
}, 200000)
