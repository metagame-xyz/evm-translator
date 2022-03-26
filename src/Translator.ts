// import { Activity } from '@/types/activity'
// import { Address, Chain, chains, EthersAPIKeys } from '@/types/utils'
// import { BaseProvider, TransactionReceipt } from '@ethersproject/providers'
// import { getDefaultProvider } from 'ethers'
import { Chain, RawTxData } from '@interfaces'
import { chains } from '@utils'
import Covalent from '@utils/clients/Covalent'
import { covalentToRawTxData } from 'core/rawTransformations'

export type EthersAPIKeys = {
    alchemy: string
    etherscan: string
    infura: string
    pocket: {
        applicationId: string
        applicationSecretKey: string
    }
}

// export const defaultMainnetProvider = getDefaultProvider('homestead', ethersApiKeys)

export type TranslatorConfig = {
    covalentApiKey: string
    chain?: Chain
    walletAddressAsContext?: string // should it say "bought" vs "sold"? Depends on the context
    // ethersApiKeys?: EthersAPIKeys
    // getContractNames?: boolean
    // getMethodNames?: boolean
    // filterOutSpam?: boolean
    // queryNode?: boolean
    // spamRegistry?: string
}

class Translator {
    #Covalent: Covalent
    config: TranslatorConfig = {
        chain: chains.ethereum,
        covalentApiKey: '',
        // queryNode: false,
        // getContractNames: false,
        // getMethodNames: false,
        // filterOutSpam: false,
    }
    // provider: BaseProvider

    constructor(config: TranslatorConfig) {
        this.config = { ...this.config, ...config }

        this.#Covalent = new Covalent(this.config.covalentApiKey, this.config.chain?.id)

        // this.provider = provider || getDefaultProvider('homestead', ethersApiKeys)
    }

    public async translateFromHash(txHash: string): Promise<RawTxData | boolean> {
        const response = await this.#Covalent.getTransactionFor(txHash)
        const rawCovalentData = response.items[0]

        const rawTxData = covalentToRawTxData(rawCovalentData)
        // const decodedTxData = await decode(rawTxData, {
        //     covalentData: rawCovalentData,
        //     useNodeForENS: false,
        //     use4ByteDirectory: false,
        //     useTinTin: false,
        // })

        return rawTxData
    }

    // public async translateFromHashes(hashes: string[]): Promise<TransactionReceipt[] | boolean> {
    //     return []
    // }

    // will require a connection to etherscan or some other wallet-indexed source
    // public async translateFromWalletAddress(address: string): Promise<Activity[] | boolean> {
    //     return []
    // }

    // public translateFromTransactions(transactions: TransactionReceipt[]): Activity[] {
    //     const transaction = transactions[0]
    //     const userAddress = transaction.from as Address

    //     return []
    // }

    // for use with translateFromTransactions, other functions can have this built in
    // public async filterOutSpam(activities: Activity[]): Promise<Activity[]> {
    //     if (!this.config.spamRegistry) {
    //         return activities
    //     }
    //     // ...
    //     return []
    // }
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

// const insightsExample: Activity = {
//     source: 'on-chain',
//     chain: chains.ethereum,
//     id: '0xac07b4ca21392d96a854d31667de8e93e71de178693e4304b61be49121fccbe8',
//     raw: {
//         input: '0x6a761202000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000003bf3b91c95b0000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000000004d0e30db0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000082308f29a8d68bc74e92e94f4112cdfdfdbda15f40ab2339ecbae2b20909f91aa03faedadc339913ce46e647838be4b1e28e7140c5f9c4194f34923433e502b3021c5342609612e07b4e14d9209d1620034580e76d92d1e6c1edb96d5c46bb22af1a56ae4aa251350dd829fd5da2eb7e34d6d4e1fd060401c385e7fdc4b081db367a1c000000000000000000000000000000000000000000000000000000000000',
//         value: '0',
//         to: '0xa951c5d226d532b54cb8bcf771811895a70c2d84',
//         from: '0x17a059b6b0c8af433032d554b0392995155452e6',
//         block: 14330685,
//         gas_units: 89896,
//         gas_price: 40185164403,
//         reverted: false,
//         timestamp: 1646534353,
//     },
//     decoded: {
//         fromENS: 'brenner.eth',
//         // officialContractName: "", // This is a gnosis
//         contractMethod: 'execTransaction',
//         transactionType: 'contract_interaction',
//         interactions: [
//             {
//                 contract: 'Wrapped Ether',
//                 contract_symbol: 'WETH',
//                 contract_address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
//                 details: [
//                     {
//                         event: 'Deposit',
//                         dst: '0xa951c5d226d532b54cb8bcf771811895a70c2d84',
//                         wad: '270000000000000000',
//                     },
//                 ],
//             },
//         ],
//     },
//     interpretation: {
//         contract_name: 'Wrapped Ether',
//         action: 'received',
//         example_description: 'Wrapped Ether received 27 ETH',
//     },
//     explorer_url: 'https://etherscan.io/tx/0xac07b4ca21392d96a854d31667de8e93e71de178693e4304b61be49121fccbe8',
//     value_in_eth: '0',
// }
