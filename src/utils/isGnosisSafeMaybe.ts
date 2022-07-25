import { AlchemyProvider, JsonRpcProvider } from '@ethersproject/providers'
import EthersAdapter from '@gnosis.pm/safe-ethers-lib'
import SafeServiceClient from '@gnosis.pm/safe-service-client'
import { ethers } from 'ethers'

import { ContractType } from 'interfaces/decoded'

async function isGnosisSafeMaybe(address: string, provider: AlchemyProvider | JsonRpcProvider): Promise<ContractType> {
    const jsonProvider = new JsonRpcProvider(provider.connection)
    const signer = jsonProvider.getSigner()

    const ethAdapter = new EthersAdapter({ ethers, signer })

    const txServiceUrl = 'https://safe-transaction.gnosis.io'
    const safeService = new SafeServiceClient({ txServiceUrl, ethAdapter })

    try {
        const safeInfo = await safeService.getSafeInfo(address)
        return ContractType.GNOSIS
    } catch (e) {
        return ContractType.OTHER
    }
}

export default isGnosisSafeMaybe
