import { Chain } from '@type'

const ethereum: Chain = {
    EVM: true,
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    testnet: false,
    blockExplorerUrl: 'https://etherscan.io/',
}

export const chains: Record<string, Chain> = {
    ethereum,
}
