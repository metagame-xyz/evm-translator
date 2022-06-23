import Interpreter from '../core/Interpreter'
import { chains } from '../index'
import txHashArr from '../__tests__/testTxHashArr.json'
import { MongooseDatabaseInterface } from 'utils/mongoose'
import { DecodedTx } from '../interfaces/decoded'

jest.mock('node-fetch', () => jest.fn())

test('Interpreter', async () => {
  const db = new MongooseDatabaseInterface('mongodb://localhost:27017/evm-translator')
  await db.connect()
  const txMap = await db.getManyDecodedTxMap(txHashArr)
  const filteredDecodedTxes = Object.entries(txMap).filter(([txHash, decodedTx]) => {
    if (!decodedTx) {
      console.log('Issue with decoder for tx:', txHash)
      return false
    }
    return true
  }).map(([, decodedTx]) => (decodedTx))

  const interpreter = new Interpreter(chains.ethereum)
  for (const decodedTx of filteredDecodedTxes) {
    expect(interpreter.interpretSingleTx(decodedTx!)).toMatchSnapshot()
  }
})
