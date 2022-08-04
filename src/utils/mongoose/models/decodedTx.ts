import { model, Model, models, Schema } from 'mongoose'

import { DecodedTx } from 'interfaces/decoded'

type DecodedTxModelType = Model<DecodedTx>

const DecodedTxSchema = new Schema<DecodedTx, DecodedTxModelType>(
    {
        txHash: { type: String, required: true },
        txType: { type: String, required: true },
        contractType: { type: String, required: true },
        methodCall: {
            type: {
                name: String,
                arguments: { type: Object, required: true },
                decoded: Boolean,
            },
            required: true,
        },
        traceCalls: {
            type: [],
            required: true,
        },
        contractName: String,
        officialContractName: { type: String, required: false },
        fromENS: { type: String, required: false },
        toENS: { type: String, required: false },
        interactions: {
            type: [
                {
                    contractName: String,
                    contractSymbol: String,
                    contractAddress: String,
                    contractType: String,
                    events: [],
                },
            ], // could go a few levels deeper on InteractionEvents but I'm lazy
            required: true,
        },
        nativeValueSent: { type: String, required: true },
        chainSymbol: { type: String, required: true },
        txIndex: { type: Number, required: true },
        fromAddress: { type: String, required: true },
        toAddress: { type: String, required: false },
        reverted: { type: Boolean, required: true },
        timestamp: { type: Number, required: true },
        gasUsed: { type: String, required: true },
        effectiveGasPrice: { type: String, required: false },
        allAddresses: { type: [String], required: true },
    },
    { minimize: false },
)
    .index({ txHash: 1 }, { unique: true })
    .index({ allAddresses: 1 })

export const DecodedTxModel = models.decodedTx || model<DecodedTx>('decodedTx', DecodedTxSchema)
