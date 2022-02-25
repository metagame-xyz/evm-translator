import { ethers } from 'ethers'
import collect from 'collect.js'
import Insight from '@/lib/Insight'
import Augmenter from '@/lib/Augmenter'
import { TxData } from '@/types/covalent'

type Event = {
	contract: string
	contract_symbol: string | null
	contract_address: string
	name: string
	details: Record<string, unknown>
}

class InterpretEvents extends Insight {
	name = 'Interpret Events'

	public async apply(tx: TxData): Promise<{ interactions: Array<{}>; contractName: string | null }> {
		const interactions = collect(tx.log_events)
			.reject(event => !event.sender_name)
			.mapToGroups((event): [string, Event] => {
				const details = Object.fromEntries(
					event.decoded.params.map(param => [
						param.name,
						Array.isArray(param.value) ? param.value.map(arg => arg.value) : param.value,
					])
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
			.map(events => {
				const event = events[0] as Event

				return {
					contract: event.contract,
					contract_symbol: event.contract_symbol,
					contract_address: event.contract_address,
					details: events.map(event => ({ event: event.name, ...event.details })),
				}
			})

		return {
			interactions: interactions.values().toArray(),
			contractName: interactions.get(tx.to_address)?.contract,
		}
	}
}

export const registerInsight = (augmenter: typeof Augmenter) => augmenter.register(new InterpretEvents())

export default InterpretEvents
