import { Chain, Chains } from '@interfaces'

const ethereum: Chain = {
    EVM: true,
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    testnet: false,
    blockExplorerUrl: 'https://etherscan.io/',
}

export const chains: Chains = {
    ethereum,
}
