import { BaseProvider, getDefaultProvider } from '@ethersproject/providers'
import { Augmenter } from 'core/Augmenter'
import Interpreter from 'core/Interpreter'
import RawDataFetcher from 'core/RawDataFetcher'
import { ActivityData, Address, Chain, EthersAPIKeys } from 'interfaces'
import { chains, cleanseDataInPlace } from 'utils'
import Covalent from 'utils/clients/Covalent'

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

    provider: BaseProvider
    covalent: Covalent

    rawDataFetcher: RawDataFetcher
    augmenter: Augmenter
    interpreter!: Interpreter

    constructor(config: TranslatorConfig) {
        this.config = { chain: chains.ethereum, ...config }
        this.provider = getDefaultProvider(this.config.chain.id, this.config.ethersApiKeys)
        this.covalent = new Covalent(this.config.covalentApiKey, this.config.chain.id)

        this.rawDataFetcher = new RawDataFetcher(this.provider, this.covalent)
        this.augmenter = new Augmenter(this.provider, this.covalent)
    }

    public async translateFromHash(txHash: string, userAddress = null as Address | null): Promise<ActivityData> {
        /*
            step 1 (parallelize)
            get tx from ethers
            get txReceipt from ethers
        */
        const rawTxData = await this.rawDataFetcher.getTxData(txHash)

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
        const interpreter = new Interpreter(addressForContext, this.config.chain)

        const interpretedData = interpreter.interpretSingleTx(rawTxData, decodedDataArr[0])

        // return rawCovalentData

        const allData = { interpretedData, decodedData: decodedDataArr[0], rawTxData }
        cleanseDataInPlace(allData)

        return allData
    }

    public async translateFromAddress(
        addressUnclean: Address,
        initiatedTxsOnly = true,
        limit = 100,
    ): Promise<ActivityData[]> {
        const address = addressUnclean.toLowerCase() as Address

        console.log('adddress we made it', address)

        const { rawTxDataArr, covalentTxDataArr } = await this.rawDataFetcher.getTxDataWithCovalentByAddress(
            address,
            initiatedTxsOnly,
            limit,
        )

        const decodedDataArr = await this.augmenter.decode(rawTxDataArr, covalentTxDataArr)

        const interpreter = new Interpreter(address, this.config.chain)

        const interpretedDataArr = interpreter.interpret(rawTxDataArr, decodedDataArr)

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
