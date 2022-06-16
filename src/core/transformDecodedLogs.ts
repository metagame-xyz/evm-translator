import collect from 'collect.js'

import {
    ContractData,
    DecodedCallData,
    Interaction,
    MostTypes,
    RawDecodedCallData,
    RawDecodedLog,
} from 'interfaces/decoded'
import { AddressZ } from 'interfaces/utils'

export function transformDecodedLogs(
    decodedLogs: RawDecodedLog[],
    contractDataMap: Record<string, ContractData>,
): Interaction[] {
    // tx.log_events.forEach((event) => {
    //     console.log('decoded', event)
    //     event.decoded.params.forEach((param) => {
    //         console.log('param', param)
    //     })
    // })

    const interactions = collect(decodedLogs)
        // .reject((event) => !event.sender_name)

        .reject((log) => !log)
        .mapToGroups((log: RawDecodedLog): [string, Interaction] => {
            // console.log('params', event.decoded.params)
            const events = Object.fromEntries(
                log.events?.map((param) => [
                    param.name,
                    // Array.isArray(param.value) ? param.value.map((arg) => arg.value) :
                    param.value,
                ]) ?? [],
            )

            const address = AddressZ.parse(log.address)
            const contractData = contractDataMap[AddressZ.parse(address)]

            return [
                address,
                {
                    contractName: contractData?.contractName || null,
                    contractSymbol: contractData?.tokenSymbol || null,
                    contractAddress: AddressZ.parse(address),
                    events: [
                        {
                            eventName: log.name,
                            logIndex: log.logIndex,
                            params: events,
                            ...(!log.decoded && { decoded: log.decoded }),
                        },
                    ],
                },
            ]
        })
        .map((interactions: Interaction[]): Interaction => {
            return {
                ...interactions[0],
                events: interactions.map((i: Interaction) => i.events).flat(),
            }
        })

    return interactions.values().toArray()
}

export function transformDecodedData(rawDecodedCallData: RawDecodedCallData): DecodedCallData {
    const params: Record<string, MostTypes> = {}

    rawDecodedCallData.params.forEach((param) => {
        params[param.name] = param.value
    })

    return {
        name: rawDecodedCallData.name,
        params,
    }
}
