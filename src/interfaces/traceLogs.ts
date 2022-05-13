// import { BigNumber } from 'ethers'
// import { Address } from 'interfaces'

// type ParityTrace struct {
// 	// Do not change the ordering of these fields -- allows for easier comparison with other clients
// 	Action              interface{}  `json:"action"` // Can be either CallTraceAction or CreateTraceAction
// 	BlockHash           *common.Hash `json:"blockHash,omitempty"`
// 	BlockNumber         *uint64      `json:"blockNumber,omitempty"`
// 	Error               string       `json:"error,omitempty"`
// 	Result              interface{}  `json:"result"`
// 	Subtraces           int          `json:"subtraces"`
// 	TraceAddress        []int        `json:"traceAddress"`
// 	TransactionHash     *common.Hash `json:"transactionHash,omitempty"`
// 	TransactionPosition *uint64      `json:"transactionPosition,omitempty"`
// 	Type                string       `json:"type"`
// }

// export type UnvalidatedTraceLog = {
//     action: UnvalidatedTraceLogAction
//     blockHash?: string
//     blockNumber?: number
//     result: {
//         gasUsed: string // hex
//         output: string // hex
//     }
//     subtraces: number
//     traceAddress: number[]
//     transactionHash?: string
//     transactionPosition?: number
//     type: string
//     error?: string
// }

// export type UnvalidatedTraceLogAction = {
//     callType: string
//     from: Address
//     to: Address
//     gas: string //hex
//     input: string //hex
//     value: string //hex
// }

// export type TraceLog = {
//     action: TraceLogAction
//     blockHash: string
//     blockNumber: number
//     result: {
//         gasUsed: BigNumber // hex
//         output: string // hex
//     }
//     subtraces: number
//     traceAddress: number[]
//     transactionHash: string
//     transactionPosition: number
//     type: string
// }

// export type TraceLogAction = {
//     callType: string
//     from: Address
//     to: Address
//     gas: BigNumber //hex
//     input: string //hex
//     value: BigNumber //hex
// }
