import { model, Model, models, Schema } from 'mongoose'

import { ABI_Row } from 'interfaces/abi'

type ABI_RowModelType = Model<ABI_Row>

const ABI_RowSchema = new Schema<ABI_Row, ABI_RowModelType>({
    name: { type: String, required: true },
    type: { type: String, required: true },
    hashableSignature: { type: String, required: true },
    hashedSignature: { type: String, required: true },
    fullSignature: { type: String, required: true },
    abiJSON: { type: {}, required: true },
    default: { type: Boolean, required: false },
}).index({ hashedSignature: 1, fullSignature: -1 }, { unique: true })

export const ABI_RowModel = models.abi || model<ABI_Row>('abi', ABI_RowSchema)
