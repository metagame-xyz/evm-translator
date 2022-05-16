import { AlchemyProvider, BaseProvider, getDefaultProvider } from '@ethersproject/providers'

import { ActivityData, Chain, EthersAPIKeys } from 'interfaces'
import { ActivityDataWthZenLedger, ZenLedgerRow } from 'interfaces/zenLedger'

import { chains, cleanseDataInPlace } from 'utils'
import Covalent from 'utils/clients/Covalent'
import Etherscan from 'utils/clients/Etherscan'

import { Augmenter } from 'core/Augmenter'
import Interpreter from 'core/Interpreter'
import RawDataFetcher from 'core/RawDataFetcher'
import TaxFormatter from 'core/TaxFormatter'

// export const defaultMainnetProvider = getDefaultProvider('homestead', ethersApiKeys)

export type TranslatorConfig = {
    covalentApiKey: string
    chain?: Chain
    walletAddressAsContext?: string // should it say "bought" vs "sold"? Depends on the context
    ethersApiKeys: EthersAPIKeys
    // getContractNames?: boolean
    // getMethodNames?: boolean
    // filterOutSpam?: boolean
    // queryNode?: boolean
    // spamRegistry?: string
}

export type TranslatorConfigWithDefaults = TranslatorConfig & { chain: Chain }

class Translator {
    config: TranslatorConfigWithDefaults

    provider: AlchemyProvider
    covalent: Covalent
    etherscan: Etherscan

    rawDataFetcher: RawDataFetcher
    augmenter: Augmenter
    interpreter!: Interpreter

    constructor(config: TranslatorConfig) {
        this.config = { chain: chains.ethereum, ...config }

        const chainId = this.config.chain.id

        if (this.config.chain === chains.polygon) {
            this.provider = new AlchemyProvider(chainId, this.config.ethersApiKeys.alchemy)
        } else {
            this.provider = new AlchemyProvider(chainId, this.config.ethersApiKeys.alchemy)
            // this.provider = getDefaultProvider(1, this.config.ethersApiKeys)
        }

        this.covalent = new Covalent(this.config.covalentApiKey, chainId)
        this.etherscan = new Etherscan(this.config.ethersApiKeys.etherscan)

        this.rawDataFetcher = new RawDataFetcher(this.provider, this.covalent)
        this.augmenter = new Augmenter(this.provider, this.covalent, this.etherscan)
    }

    public async translateFromHash(txHash: string, userAddress = null): Promise<ActivityData> {
        try {
            /*
            step 1 (parallelize)
            get tx from ethers
            get txReceipt from ethers
            */
            const rawTxData = await this.rawDataFetcher.getTxData(txHash)
            // console.log('rawTxData', rawTxData)

            /*
           step 2 (parallelize)
           decode method name from tx.data via contract JSON, ABI, or 4byte
           augment contractName from contract JSON, Covalent, or TinTin
           augment param data of logs from ABI (etherscan) or Covalent)
           augment addresses from Ethers (need to find all address-shaped params)
           */

            const decodedDataArr = await this.augmenter.decode([rawTxData])

            /*
          step 3
          interpret the decoded data
          */
            // const userAddress =
            const addressForContext = userAddress || rawTxData.txResponse.from
            const interpreter = new Interpreter(this.config.chain, addressForContext)

            const interpretedData = interpreter.interpretSingleTx(decodedDataArr[0])

            // return rawCovalentData

            const allData = { interpretedData, decodedData: decodedDataArr[0], rawTxData }
            cleanseDataInPlace(allData)

            return allData
        } catch (e) {
            console.log('err', e)
            throw e
        }
    }

    public async translateFromAddress(
        addressUnclean: string,
        includeInitiatedTxs = true,
        includeNotInitiatedTxs = false,
        limit = 100,
    ): Promise<ActivityData[] | ActivityDataWthZenLedger[]> {
        const address = addressUnclean.toLowerCase()

        console.log('address we made it', address)

        const { rawTxDataArr, covalentTxDataArr } = await this.rawDataFetcher.getTxDataWithCovalentByAddress(
            address,
            includeInitiatedTxs,
            includeNotInitiatedTxs,
            limit,
        )

        const decodedDataArr = await this.augmenter.decode(rawTxDataArr, covalentTxDataArr)

        const interpreter = new Interpreter(this.config.chain, address)

        const interpretedDataArr = interpreter.interpret(decodedDataArr)

        const allData: ActivityData[] = []

        for (let i = 0; i < rawTxDataArr.length; i++) {
            const rawTxData = rawTxDataArr[i]
            const decodedData = decodedDataArr[i]
            const interpretedData = interpretedDataArr[i]

            const allDataItem: ActivityData = {
                decodedData,
                interpretedData,
                rawTxData,
            }

            cleanseDataInPlace(allDataItem)

            allData.push(allDataItem)
        }

        return allData
    }

    public async translateWithTaxData(
        addressUnclean: string,
        includeInitiatedTxs = true,
        includeNotInitiatedTxs = false,
        limit = 100,
    ): Promise<ZenLedgerRow[]> {
        try {
            const address = addressUnclean.toLowerCase()

            const allData = await this.translateFromAddress(address, includeInitiatedTxs, includeNotInitiatedTxs, limit)

            const taxFormatter = new TaxFormatter(address, 'brenners wallet', this.config.chain)
            const rows = taxFormatter.format(allData)

            allData.forEach((element, index) => {
                ;(element as ActivityDataWthZenLedger).taxData = rows[index]
            })

            return rows
        } catch (error) {
            console.log('error in translateWithTaxData', error)
            return []
        }
    }
}

export default Translator

export function createEthersAPIKeyObj(
    alchemy: string,
    etherscan: string,
    infura: string,
    pocketApplicationId: string,
    pocketApplicationSecretKey: string,
): EthersAPIKeys {
    return {
        alchemy,
        etherscan,
        infura,
        pocket: {
            applicationId: pocketApplicationId,
            applicationSecretKey: pocketApplicationSecretKey,
        },
    }
}
