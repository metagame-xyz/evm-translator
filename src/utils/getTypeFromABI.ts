import Etherscan from './clients/Etherscan'
import collect from 'collect.js'

import { ABI_Item, ABI_ItemUnfiltered } from 'interfaces/abi'
import { ContractType } from 'interfaces/decoded'

async function getTypeFromABI(
    contractAddress: string,
    etherscan: Etherscan,
    abiArr: ABI_ItemUnfiltered[] | null = null,
): Promise<ContractType> {
    try {
        const unfilteredAbi: ABI_ItemUnfiltered[] = abiArr || (await etherscan.getABI(contractAddress))

        const abi = unfilteredAbi.filter(({ type }) => type === 'function' || type === 'event') as ABI_Item[]

        const names = collect(abi.map(({ name }) => name))

        const ERC1155Only = ['TransferBatch', 'TransferSingle', 'URI', 'balanceOfBatch', 'safeBatchTransferFrom']
        const ERC1155Not = ['Approval', 'Transfer', 'approve', 'transferFrom']

        const ERC20Only = ['allowance', 'totalSupply', 'transfer']
        const ERC20Not = ['ApprovalForAll', 'isApprovedForAll', 'safeTransferFrom', 'setApprovalForAll']

        const ERC721Only = ['getApproved']
        const ERC721Not: string[] = []

        const isERC1155 = names.intersect(ERC1155Only).isNotEmpty() && names.intersect(ERC1155Not).isEmpty()
        const isERC20 = names.intersect(ERC20Only).isNotEmpty() && names.intersect(ERC20Not).isEmpty()
        const isERC721 = names.intersect(ERC721Only).isNotEmpty() && names.intersect(ERC721Not).isEmpty()

        if ((isERC20 && isERC721) || (isERC20 && isERC1155) || (isERC721 && isERC1155)) {
            throw new Error(`Contract ${contractAddress} fits multiple ERC specs, this must be malicious?`)
        }

        if (isERC1155) {
            return ContractType.ERC1155
        }
        if (isERC20) {
            return ContractType.ERC20
        }
        if (isERC721) {
            return ContractType.ERC721
        }
        return ContractType.OTHER
    } catch (e) {
        console.log('getTypeFromABI', e)
        return ContractType.OTHER
    }
}

export default getTypeFromABI
