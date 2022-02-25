import { ethers } from 'ethers'
import Augmenter from './Augmenter'
import { TxData } from '@/types/covalent'
import Covalent from './clients/Covalent'
import logger from './logger'

export type ActivityData = {
	data: ActivityEntry[]
	pagination: {
		page: number
		items: number
		last_page: boolean
	}
}

export type ActivityEntry = {
	id: string
	raw: {
		to: string
		from: string
		block: number
		value: string
		timestamp: number
		gas_units: number
		gas_price: number
		reverted: boolean
	}
	value_in_eth: string
	explorer_url: string
	insights: Record<string, unknown>
}

type PaginationConfig = {
	page?: number
	limit?: number
}

class Activity {
	public async forAddress(address: string, { page, limit }: PaginationConfig = {}): Promise<ActivityData> {
		logger.startTimer('fetch')
		const txData = await Covalent.getTransactionsFor(address, { page, limit })
		logger.endTimer('fetch')

		logger.startTimer('augmenting')
		const activity = await Promise.all(
			txData.items.map(async (tx: TxData): Promise<ActivityEntry> => {
				return {
					id: tx.tx_hash,
					raw: {
						value: tx.value,
						to: tx.to_address,
						from: tx.from_address,
						block: tx.block_height,
						gas_units: tx.gas_spent,
						gas_price: tx.gas_price,
						reverted: !tx.successful,
						timestamp: new Date(tx.block_signed_at).getTime() / 1000,
					},
					insights: await Augmenter.augment(tx),
					explorer_url: `https://etherscan.io/tx/${tx.tx_hash}`,
					value_in_eth: tx.value == '0' ? '0' : ethers.utils.formatUnits(tx.value),
				}
			})
		)
		logger.endTimer('augmenting')

		return { data: activity, pagination: { page, items: activity.length, last_page: !txData.pagination.has_more } }
	}
}

export default new Activity()
