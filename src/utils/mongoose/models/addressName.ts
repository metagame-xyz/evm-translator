import { model, Model, models, Schema } from 'mongoose'

import { AddressNameData } from 'interfaces/decoded'

type AddressNameModelType = Model<AddressNameData>

const AddressNameSchema = new Schema<AddressNameData, AddressNameModelType>({
    address: { type: String, required: true, lowercase: true, nullable: false },
    name: { type: String, required: false },
    entity: { type: String, required: false },
    ancestorAddress: { type: String, required: false, lowercase: true },
}).index({ address: 1 }, { unique: true })

export const AddressNameModel = (models.addressName ||
    model<AddressNameData>('addressName', AddressNameSchema)) as AddressNameModelType
