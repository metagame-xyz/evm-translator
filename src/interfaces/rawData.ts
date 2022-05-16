import {
    AddressZ,
    BigNumberZ,
    boolean,
    HashZ,
    int,
    nullableInt,
    number,
    optionalAddressZ,
    OptionalBigNumberZ,
    string,
} from 'interfaces/utils'
import { z } from 'zod'

// type EVMTransaction struct {
// 	Hash               string                 `json:"hash"`
// 	Nonce              int                    `json:"nonce"`
// 	BlockHash          string                 `json:"blockHash"`
// 	BlockNumber        *int                   `json:"blockNumber"`
// 	TransactionIndex   *int                   `json:"transactionIndex"`
// 	From               string                 `json:"from"`
// 	To                 string                 `json:"to"`
// 	Value              big.Int                `json:"value"`
// 	Gas                int                    `json:"gas"`
// 	GasPrice           big.Int                `json:"gasPrice"`
// 	Input              string                 `json:"input"`
// 	TransactionReceipt *EVMTransactionReceipt `json:"transactionReceipt"`
// 	Trace              *EVMTrace              `json:"trace"`
// }

// type EVMTransactionReceipt struct {
// 	TransactionHash   string    `json:"transactionHash"`
// 	TransactionIndex  int       `json:"transactionIndex"`
// 	BlockHash         string    `json:"blockHash"`
// 	BlockNumber       int       `json:"blockNumber"`
// 	CumulativeGasUsed int       `json:"cumulativeGasUsed"`
// 	GasUsed           int       `json:"gasUsed"`
// 	ContractAddress   string    `json:"contractAddress"`
// 	Logs              []*EVMLog `json:"logs"`
// 	LogsBloom         string    `json:"logsBloom"`
// 	Root              string    `json:"root"`
// 	Status            string    `json:"status"`
// }

export const TxResponseZ = z.object({
    hash: HashZ,
    nonce: int,
    blockHash: HashZ, // WARNING null if it hasn't been mined yet but we shouldn't be dealing with those as of now
    blockNumber: int, // same as blockHash, nullable
    transactionIndex: int,
    from: AddressZ,
    to: optionalAddressZ,
    creates: optionalAddressZ,
    gasPrice: BigNumberZ,
    value: BigNumberZ,
    data: HashZ,
    chainId: int,
})

export type TxResponse = z.infer<typeof TxResponseZ>

export const TxReceiptLogZ = z.object({
    blockNumber: number,
    blockHash: string,
    transactionIndex: number,
    removed: boolean,
    address: AddressZ,
    data: string,
    topics: z.array(string),
    transactionHash: string,
    logIndex: number,
})

export const TxReceiptZ = z.object({
    transactionHash: HashZ,
    transactionIndex: int,
    blockHash: HashZ,
    blockNumber: int,
    cumulativeGasUsed: BigNumberZ,
    effectiveGasPrice: OptionalBigNumberZ,
    gasUsed: BigNumberZ,
    to: optionalAddressZ,
    from: AddressZ,
    logs: z.array(TxReceiptLogZ),
    status: number,
    timestamp: number,
})

export type TxReceipt = z.infer<typeof TxReceiptZ>

const CreateTraceResultZ = z.object({
    address: AddressZ.nullable(),
    code: string, //bytes
    gasUsed: BigNumberZ,
})

const StandardTraceResultZ = z.object({
    gasUsed: BigNumberZ,
    output: string, // bytes
})

const TraceResultZ = z.union([StandardTraceResultZ, CreateTraceResultZ])

export type CreateTraceResult = z.infer<typeof CreateTraceResultZ>
export type StandardTraceResult = z.infer<typeof StandardTraceResultZ>
export type TraceResult = z.infer<typeof TraceResultZ>

// https://ethereum.stackexchange.com/questions/63743/whats-the-difference-between-type-and-calltype-in-parity-trace
// https://github.com/openethereum/parity-ethereum/blob/master/rpc/src/v1/types/trace.rs#L246
const TraceActionCallTypeZ = z.enum(['call', 'delegateCall', 'callCode', 'staticCall'])
// const TraceActionCreateTypeZ = z.enum(['create', 'create2'])
// const TraceActionSuicideTypeZ = z.enum(['suicide'])
// const TraceACtionRewardTypeZ = z.enum(['block', 'uncle', 'emptyStep', 'extneral'])

const CallTraceActionZ = z.object({
    callType: TraceActionCallTypeZ,
    from: AddressZ,
    to: AddressZ,
    gas: BigNumberZ,
    input: string,
    value: BigNumberZ,
})

const CreateTraceActionZ = z.object({
    from: AddressZ,
    gas: BigNumberZ,
    init: string, // bytes
    value: BigNumberZ,
})

const SuicideTraceActionZ = z.object({
    address: AddressZ,
    refundAddress: AddressZ,
    balance: BigNumberZ,
})

const RewardTraceActionZ = z.object({
    author: AddressZ,
    rewardType: string,
    value: BigNumberZ,
})

const TraceActionZ = z.union([CallTraceActionZ, CreateTraceActionZ, SuicideTraceActionZ, RewardTraceActionZ])

export type CallTraceAction = z.infer<typeof CallTraceActionZ>
export type CreateTraceAction = z.infer<typeof CreateTraceActionZ>
export type SuicideTraceAction = z.infer<typeof SuicideTraceActionZ>
export type RewardTraceAction = z.infer<typeof RewardTraceActionZ>
export type TraceAction = z.infer<typeof TraceActionZ>

export const TraceType = z.enum(['call', 'create', 'suicide', 'reward'])

const traceLogAbstractZ = z.object({
    type: TraceType,
    action: TraceActionZ,
    blockHash: HashZ,
    blockNumber: nullableInt,
    error: string.optional(),
    subtraces: number,
    traceAddress: z.array(number),
    transactionHash: HashZ,
    transactionPosition: nullableInt,
})

export const CallTraceLogZ = traceLogAbstractZ.extend({
    type: z.literal(TraceType.Enum.call),
    action: CallTraceActionZ,
    result: StandardTraceResultZ,
})
export const CreateTraceLogZ = traceLogAbstractZ.extend({
    type: z.literal(TraceType.Enum.create),
    action: CreateTraceActionZ,
    result: CreateTraceResultZ,
})
export const SuicideTraceLogZ = traceLogAbstractZ.extend({
    type: z.literal(TraceType.Enum.suicide),
    action: SuicideTraceActionZ,
    result: StandardTraceResultZ,
})
export const RewardTraceLogZ = traceLogAbstractZ.extend({
    type: z.literal(TraceType.Enum.reward),
    action: RewardTraceActionZ,
    result: StandardTraceResultZ,
})

export const TraceLogZ = z.discriminatedUnion('type', [
    CallTraceLogZ,
    CreateTraceLogZ,
    SuicideTraceLogZ,
    RewardTraceLogZ,
])

export type TraceLog = z.infer<typeof TraceLogZ>

export type CallTraceLog = z.infer<typeof CallTraceLogZ>

export type RawTxData = {
    txResponse: TxResponse
    txReceipt: TxReceipt
    txTrace: TraceLog[]
}

export type RawTxDataWithoutTrace = {
    txResponse: TxResponse
    txReceipt: TxReceipt
}
