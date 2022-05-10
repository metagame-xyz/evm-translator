import erc20 from './erc20.json'
import fallback from './fallback.json'
import { ContractType } from 'interfaces'

const tokenABIMap = {
    [ContractType.ERC20]: erc20,
    [ContractType.ERC721]: fallback,
    [ContractType.ERC1155]: fallback,
    [ContractType.WETH]: fallback,
    [ContractType.GNOSIS]: fallback,
    [ContractType.OTHER]: fallback,
}

export default tokenABIMap
