import { RawDecodedCallData } from 'interfaces/decoded'
import { TraceLog } from 'interfaces/rawData'

import ABIDecoder from 'utils/abi-decoder'

const pruneTraceRecursive = (calls: TraceLog[]): TraceLog[] => {
    if (!calls.length) {
        console.log('ERROR! Faulty structure of multicall subtraces')
        return []
    }
    if (!calls[0].subtraces) {
        return calls
    }
    const callsToRemove = calls[0].subtraces
    let newRestOfCalls = [...calls]
    for (let i = 0; i < callsToRemove; i++) {
        newRestOfCalls = [newRestOfCalls[0], ...pruneTraceRecursive(newRestOfCalls.slice(1))]
        newRestOfCalls.splice(1, 1)
    }

    return newRestOfCalls
}

export async function decodeRawTxTrace(abiDecoder: ABIDecoder, txTrace: TraceLog[]): Promise<RawDecodedCallData[]> {
    if (!txTrace.length) {
        return new Promise((resolve) => resolve([]))
    }
    const secondLevelCallsCount = txTrace[0].subtraces
    const secondLevelCalls = []
    let callsToPrune = txTrace.slice(1)
    for (let i = 0; i < secondLevelCallsCount; i++) {
        callsToPrune = pruneTraceRecursive(callsToPrune)
        secondLevelCalls.push(callsToPrune[0])
        callsToPrune.shift()
    }
    if (callsToPrune.length) {
        console.log('ERROR! Faulty structure of multicall subtraces')
        return new Promise((resolve) => resolve([]))
    }
    return Promise.all(
        secondLevelCalls.map((call) =>
            abiDecoder.decodeMethod((call.action as any)?.input || '').then((decodedCall) => ({
                ...decodedCall,
                from: (call.action as any)?.from,
                to: (call.action as any)?.to,
            })),
        ),
    )
}
