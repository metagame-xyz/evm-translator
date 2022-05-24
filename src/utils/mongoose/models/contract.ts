import { model, Model, models, Schema } from 'mongoose'

import { ContractData } from 'interfaces'
import { ABI_ItemUnfiltered } from 'interfaces/abi'

type ContractModelType = Model<ContractData>

const ABI_ItemSchema = new Schema<ABI_ItemUnfiltered>({
    name: { type: String, required: false },
    type: { type: String, required: true },
    inputs: { type: [], required: false },
    outputs: { type: [], required: false },
    stateMutability: { type: String, required: false },
    anonymous: { type: Boolean, required: false },
})

const ContractSchema = new Schema<ContractData, ContractModelType>({
    address: { type: String, required: true },
    type: { type: String, required: true }, // TODO: add the enum
    tokenName: { type: String, required: false },
    tokenSymbol: { type: String, required: false },
    contractName: { type: String, required: false },
    contractOfficialName: { type: String, required: false },
    abi: { type: [ABI_ItemSchema], required: true },
})

export const ContractModel = models.contract || model<ContractData>('contract', ContractSchema)
