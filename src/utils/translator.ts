import Translator, { chains } from '../index'

import {
    ALCHEMY_PROJECT_ID,
    COVALENT_API_KEY,
    ETHERSCAN_API_KEY,
    EVM_TRANSLATOR_CONNECTION_STRING,
} from 'utils/constants'

export default async function getTranslator(address: string | null = null, networkId = 1): Promise<Translator> {
    const chain = Object.values(chains).find((chain) => chain.id === networkId) || chains.ethereum

    const translator = new Translator({
        chain,
        alchemyProjectId: ALCHEMY_PROJECT_ID ?? '',
        etherscanAPIKey: ETHERSCAN_API_KEY ?? '',
        connectionString: EVM_TRANSLATOR_CONNECTION_STRING,
        covalentAPIKey: COVALENT_API_KEY,
        etherscanServiceLevel: 30,
        userAddress: address ?? undefined,
    })

    if (address) translator.updateUserAddress(address)

    await translator.initializeMongoose()

    return translator
}
