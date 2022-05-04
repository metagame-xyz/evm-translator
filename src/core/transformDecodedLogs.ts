import { Log } from '@ethersproject/providers'
import collect from 'collect.js'
import { ethers } from 'ethers'
import { BigNumber } from 'ethers'
import { Interaction, TxReceipt } from 'interfaces'
import { validateAndNormalizeAddress } from 'utils'

// import { PrismaClient } from '@prisma/client'
// const prisma = new PrismaClient()

type Event = {
    contractName: string
    contractSymbol: string | null
    contractAddress: string
    name: string
    logIndex: number
    events: Record<string, unknown>
}

export type DecodedLog = {
    name: string
    address: string
    logIndex: number
    events: {
        name: string
        type: string
        value: string | string[]
    }[]
}

export type DecodedDataAndLogs = {
    decodedData: {
        name: string
        params: {
            name: string
            type: string
            value: string | number | boolean | null | string[]
        }[]
    }
    decodedLogs: DecodedLog[]
}

export function transformDecodedLogs(rawLogs: Log[], decodedLogs: DecodedLog[]): Array<Interaction> {
    // tx.log_events.forEach((event) => {
    //     console.log('decoded', event)
    //     event.decoded.params.forEach((param) => {
    //         console.log('param', param)
    //     })
    // })

    const interactions = collect(decodedLogs)
        // .reject((event) => !event.sender_name)

        .reject((log) => !log)
        .mapToGroups((log: DecodedLog): [string, Event] => {
            // console.log('params', event.decoded.params)
            console.log('log', log)
            const events = Object.fromEntries(
                log.events?.map((param) => [
                    param.name,
                    // Array.isArray(param.value) ? param.value.map((arg) => arg.value) :
                    param.value,
                ]) ?? [],
            )

            // console.log('details', events)

            // if (events.value && log.sender_contract_decimals)
            //     events.value = ethers.utils
            //         .formatUnits(events.value, log.sender_contract_decimals)
            //         .replace(/\.0$/, '')

            // events = covalentERC721Shim(events, log)
            // console.log('event', event)
            // console.log('detials', details)

            return [
                log.address,
                {
                    contractName: 'fake name',
                    contractSymbol: 'fake name',
                    contractAddress: log.address,
                    name: log.name,
                    logIndex: log.logIndex,
                    events,
                },
            ]
        })
        .map((events): Interaction => {
            const event = events[0] as Event

            return {
                contractName: event.contractName,
                contractSymbol: event.contractSymbol,
                contractAddress: validateAndNormalizeAddress(event.contractAddress),
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
