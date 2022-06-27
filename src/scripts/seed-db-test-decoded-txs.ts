import { filterABIMap } from 'utils'
import { MongooseDatabaseInterface } from 'utils/mongoose'
import txHashArr from '../__tests__/testTxHashArr.json'
import getTranslator from '../utils/translator';
import { DecodedTx } from 'interfaces/decoded';

async function run() {
  const db = new MongooseDatabaseInterface('mongodb://localhost:27017/evm-translator')
  await db.connect()

  const translator = await getTranslator()

  await translator.allDataFromTxHashArr(txHashArr);
  // const decodedTxArr: DecodedTx[] = [];
  // for (const txHash of txHashArr) {
  //   const rawTxData = await translator.getRawTxData(txHash)
  //   const addresses = translator.getContractAddressesFromRawTxData(rawTxData)
  //   const [unfilteredAbiMap, officialContractNamesMap] = await translator.getABIsAndNamesForContracts(addresses)
  //   const proxyAddressMap = await translator.getProxyContractMap(addresses)
  //   const AbiMap = filterABIMap(unfilteredAbiMap)
  //   const ensMap = await translator.getENSNames(addresses)
  //   const contractDataMap = await translator.getContractsData(AbiMap, officialContractNamesMap, proxyAddressMap)

  //   const { decodedLogs, decodedCallData } = await translator.decodeTxData(rawTxData, AbiMap, contractDataMap)
  //   const decodedWithAugmentation = translator.augmentDecodedData(
  //     decodedLogs,
  //     decodedCallData,
  //     ensMap,
  //     contractDataMap,
  //     rawTxData,
  //   )
  //   decodedTxArr.push(decodedWithAugmentation)
  // }

  // await db.addOrUpdateManyDecodedTx(decodedTxArr)

  process.exit(0)
}

run()
