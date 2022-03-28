import { Interaction } from '@interfaces'
import { CovalentLogEvent, CovalentTxData } from '@interfaces/covalent'
import collect from 'collect.js'
import { ethers } from 'ethers'
import { BigNumber } from 'ethers'

// import { PrismaClient } from '@prisma/client'
// const prisma = new PrismaClient()

type Event = {
    contract: string
    contract_symbol: string | null
    contract_address: string
    name: string
    events: Record<string, unknown>
}

// covalent returns 'value:null' for ERC721's instead of decoding the param as tokenId
function covalentERC721Shim(events: Record<string, any>, event: CovalentLogEvent) {
    const incorrectValueParam = event.decoded.params.find((param) => param.name === 'value' && !param.decoded)

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

            console.log('details', events)

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
                    contract: event.sender_name,
                    contract_symbol: event.sender_contract_ticker_symbol,
                    contract_address: event.sender_address,
                    name: event.decoded.name,
                    events,
                },
            ]
        })
        .map((events) => {
            const event = events[0] as Event

            return {
                contract: event.contract,
                contract_symbol: event.contract_symbol,
                contract_address: event.contract_address,
                events: events.map((event: Event) => ({ event: event.name, ...event.events })),
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
