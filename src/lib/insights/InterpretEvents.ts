import { ethers } from 'ethers'
import collect from 'collect.js'
import Augmenter from '@/lib/Augmenter'
import { TxData } from '@/types/covalent'
import { PrismaClient } from '@prisma/client'
import { correctContractName } from '../utils'
import Insight, { Config } from '@/lib/Insight'

const prisma = new PrismaClient()

type Event = {
    contract: string
    contract_symbol: string | null
    contract_address: string
    name: string
    details: Record<string, unknown>
}

export type Interaction = {
    contract: string
    contract_symbol: string
    contract_address: string
    details: Array<{ event: string } & Record<string, unknown>>
}

class InterpretEvents extends Insight {
    name = 'Interpret Events'

    public async apply(
        tx: TxData,
        config: Config,
    ): Promise<{ interactions: Array<Interaction>; contractName: string | null }> {
        console.log('log events', tx.log_events)
        const interactions = collect(tx.log_events)
            // .reject((event) => !event.sender_name)
            .reject((event) => !event.decoded)
            .mapToGroups((event): [string, Event] => {
                console.log('params', event.decoded.params)
                const details = Object.fromEntries(
                    event.decoded.params?.map((param) => [
                        param.name,
                        Array.isArray(param.value)
                            ? param.value.map((arg) => arg.value)
                            : param.value,
                    ]) ?? [],
                )

                if (details.value && event.sender_contract_decimals)
                    details.value = ethers.utils
                        .formatUnits(details.value, event.sender_contract_decimals)
                        .replace(/\.0$/, '')

                return [
                    event.sender_address,
                    {
                        contract: event.sender_name,
                        contract_symbol: event.sender_contract_ticker_symbol,
                        contract_address: event.sender_address,
                        name: event.decoded.name,
                        details,
                    },
                ]
            })
            .map((events) => {
                const event = events[0] as Event

                return {
                    contract: event.contract,
                    contract_symbol: event.contract_symbol,
                    contract_address: event.contract_address,
                    details: events.map((event) => ({ event: event.name, ...event.details })),
                }
            })

        const contractData = interactions.get(tx.to_address)

        if (contractData?.contract) {
            prisma.contract.createMany({
                data: [
                    {
                        address: contractData.contract_address.toLowerCase(),
                        name: contractData.contract,
                        chainId: config.chainId,
                    },
                ],
                skipDuplicates: true,
            })
        }

        return {
            interactions: interactions.values().toArray(),
            contractName: correctContractName(contractData?.contract),
        }
    }
}

export const registerInsight = (augmenter: typeof Augmenter) =>
    augmenter.register(new InterpretEvents())

export default InterpretEvents
