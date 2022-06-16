import { model, Model, models, Schema } from 'mongoose'

import { ContractData } from 'interfaces/decoded'

type ContractModelType = Model<ContractData>

const ContractSchema = new Schema<ContractData, ContractModelType>({
    address: { type: String, required: true },
    type: { type: String, required: true }, // TODO: add the enum
    tokenName: { type: String, required: false },
    tokenSymbol: { type: String, required: false },
    contractName: { type: String, required: false },
    contractOfficialName: { type: String, required: false },
    abi: { type: [], required: true },
}).index({ address: 1 }, { unique: true })

export const ContractModel = models.contract || model<ContractData>('contract', ContractSchema)
