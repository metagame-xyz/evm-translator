import { BaseProvider } from '@ethersproject/providers'
import { Contract } from 'ethers'
import { Address, ContractType } from 'interfaces'
import { ERC20InterfaceId, ERC721InterfaceId, ERC1155InterfaceId } from 'utils/constants'

async function checkInterface(contractAddress: Address, provider: BaseProvider): Promise<ContractType> {
    try {
        const contract = new Contract(contractAddress, supportsInterfaceABI, provider)
        if (await contract.supportsInterface(ERC721InterfaceId)) {
            return ContractType.ERC721
        } else if (await contract.supportsInterface(ERC1155InterfaceId)) {
            return ContractType.ERC1155
        } else if (await contract.supportsInterface(ERC20InterfaceId)) {
            return ContractType.ERC20
        } else {
            return ContractType.OTHER
        }
    } catch (e) {
        console.log(`${contractAddress} doesn't have a supportsInterface function`)
        return ContractType.OTHER
    }
}

export default checkInterface

const supportsInterfaceABI = [
    {
        inputs: [
            {
                internalType: 'bytes4',
                name: 'interfaceId',
                type: 'bytes4',
            },
        ],
        name: 'supportsInterface',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
]
