import Interpreter from '../core/Interpreter'
import { chains } from '../index'
import testTxHashes, { flattenTxHashes } from '../__tests__/testTxHashes.js'
import { MongooseDatabaseInterface } from 'utils/mongoose'
import { DecodedTx } from '../interfaces/decoded'

jest.mock('node-fetch', () => jest.fn())

jest.useRealTimers();

test('Interpreter', async () => {
  jest.setTimeout(20 * 1000);
  const db = new MongooseDatabaseInterface('mongodb://localhost:27017/evm-translator')
  await db.connect()
  const interpreter = new Interpreter(chains.ethereum)
  const txMap = await db.getManyDecodedTxMap(flattenTxHashes())
  const filteredDecodedTxes = Object.entries(txMap).filter(([txHash, decodedTx]) => {
    if (!decodedTx) {
      console.log('Issue with decoder for tx:', txHash)
      return false
    }
    return true
  }).map(([, decodedTx]) => (decodedTx))

  for (const decodedTx of filteredDecodedTxes) {
    expect(interpreter.interpretSingleTx(decodedTx!)).toMatchSnapshot()
  }
})
