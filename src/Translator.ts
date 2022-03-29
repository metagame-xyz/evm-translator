// import { Activity } from '@/types/activity'
// import { Address, Chain, chains, EthersAPIKeys } from '@/types/utils'
// import { BaseProvider, TransactionReceipt } from '@ethersproject/providers'
// import { getDefaultProvider } from 'ethers'
import { BaseProvider, getDefaultProvider } from '@ethersproject/providers'
import { Address, Chain, Decoded, EthersAPIKeys, Interpretation, RawTxData } from '@interfaces'
import { chains } from '@utils'
import Covalent from '@utils/clients/Covalent'
import contractInterpreters from 'core/contractInterpreters'
import { Augmenter } from 'core/decode'
import Interpreter from 'core/Interpreter'
import { RawDataFetcher } from 'core/rawTransformations'
import { BigNumber } from 'ethers'
import traverse from 'traverse'

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

        this.rawDataFetcher = new RawDataFetcher(this.provider)
        this.augmenter = new Augmenter(this.provider, this.covalent)
    }

    public async translateFromHash(
        txHash: string,
        userAddress = null as Address | null,
    ): Promise<{ rawTxData: RawTxData; decodedData: Decoded; interpretedData: Interpretation }> {
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

        const decodedData = await this.augmenter.decode(rawTxData)

        /*
            step 3
            interpret the decoded data
        */
        // const userAddress =
        const addressForContext = (userAddress || rawTxData.txResponse.from) as Address
        const interpreter = new Interpreter(addressForContext, contractInterpreters, this.config.chain)

        const interpretedData = interpreter.interpret(rawTxData, decodedData)

        // return rawCovalentData

        const allData = { rawTxData, decodedData, interpretedData }
        traverse(allData).forEach(function (x) {
            if (x instanceof BigNumber) {
                this.update(x.toString())
            }
            if (typeof x === 'undefined') {
                this.update(null)
            }
        })
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
