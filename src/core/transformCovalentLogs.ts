import collect from 'collect.js'
import { ethers } from 'ethers'
import { BigNumber } from 'ethers'

import { CovalentLogEvent, CovalentTxData } from 'interfaces/covalent'
import { Interaction } from 'interfaces/decoded'

type Event = {
    contractName: string
    contractSymbol: string | null
    contractAddress: string
    name: string
    logIndex: number
    events: Record<string, unknown>
}

// covalent returns 'value:null' for ERC721's instead of decoding the param as tokenId
function covalentERC721Shim(events: Record<string, any>, event: CovalentLogEvent): Record<string, any> {
    // only transfer events, other contract-related events might break this
    if (event.decoded.name !== 'Transfer') {
        return events
    }

    const incorrectValueParam = event?.decoded?.params?.find((param) => param.name === 'value' && !param.decoded)

    if (incorrectValueParam) {
        const decodedValue = BigNumber.from(event.raw_log_topics[3])?.toString()
        if (decodedValue) {
            events.tokenId = decodedValue
            delete events.value
        }
    }

    return events
}

export function transformCovalentEvents(tx: CovalentTxData): Array<Interaction> {
    // tx.log_events.forEach((event) => {
    //     console.log('decoded', event)
    //     event.decoded.params.forEach((param) => {
    //         console.log('param', param)
    //     })
    // })

    const interactions = collect(tx.log_events)
        // .reject((event) => !event.sender_name)
        .reject((event) => !event.decoded)
        .mapToGroups((event: CovalentLogEvent): [string, Event] => {
            // console.log('params', event.decoded.params)
            let events = Object.fromEntries(
                event.decoded.params?.map((param) => [
                    param.name,
                    Array.isArray(param.value) ? param.value.map((arg) => arg.value) : param.value,
                ]) ?? [],
            )

            // console.log('details', events)

            if (events.value && event.sender_contract_decimals)
                events.value = ethers.utils
                    .formatUnits(events.value, event.sender_contract_decimals)
                    .replace(/\.0$/, '')

            events = covalentERC721Shim(events, event)
            // console.log('event', event)
            // console.log('detials', details)

            return [
                event.sender_address,
                {
                    contractName: event.sender_name,
                    contractSymbol: event.sender_contract_ticker_symbol,
                    contractAddress: event.sender_address,
                    name: event.decoded.name,
                    logIndex: event.log_offset,
                    events,
                },
            ]
        })
        .map((events): Interaction => {
            const event = events[0] as Event

            return {
                contractName: event.contractName,
                contractSymbol: event.contractSymbol,
                contractAddress: event.contractAddress,
                events: events.map((event: Event) => ({
                    eventName: event.name,
                    logIndex: event.logIndex,
                    params: {
                        ...event.events,
                    },
                })),
            }
        })

    // const contractData = interactions.get(tx.to_address)

    // if (contractData?.contract) {
    //     prisma.contract.createMany({
    //         data: [
    //             {
    //                 address: contractData.contract_address.toLowerCase(),
    //                 name: contractData.contract,
    //                 chainId: config.chainId,
    //             },
    //         ],
    //         skipDuplicates: true,
    //     })
    // }

    // correctContractName(contractData?.contract),

    return interactions.values().toArray()
}
