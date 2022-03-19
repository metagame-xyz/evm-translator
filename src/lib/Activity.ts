import logger from './logger'
import { ethers } from 'ethers'
import Augmenter from './Augmenter'
import { CovalentConfig, TxData } from '@/types/covalent'
import Covalent from './clients/Covalent'
import { ActivityData, ActivityEntry } from '@/types/activity'

class Activity {
    public async forAddress(
        address: string,
        { chainId, page, limit }: CovalentConfig = {},
    ): Promise<ActivityData> {
        logger.startTimer('fetch')
        const txData = await Covalent.getTransactionsFor(address, { chainId, page, limit })
        logger.endTimer('fetch')

        logger.startTimer('augmenting')
        const activity = await Promise.all(
            (
                await Augmenter.augmentAll(txData.items, { chainId: chainId ?? 1 })
            ).map(
                async (tx: TxData, i): Promise<ActivityEntry> => ({
                    id: tx.tx_hash,
                    raw: {
                        input: tx.data,
                        value: tx.value,
                        to: tx.to_address,
                        from: tx.from_address,
                        block: tx.block_height,
                        gas_units: tx.gas_spent,
                        gas_price: tx.gas_price,
                        reverted: !tx.successful,
                        timestamp: new Date(tx.block_signed_at).getTime() / 1000,
                    },
                    insights: await Augmenter.augment(tx, { chainId: chainId ?? 1 }),
                    explorer_url: `https://etherscan.io/tx/${tx.tx_hash}`,
                    value_in_eth: tx.value == '0' ? '0' : ethers.utils.formatUnits(tx.value),
                }),
            ),
        )
        logger.endTimer('augmenting')

        return {
            data: activity,
            pagination: {
                page: page + 1,
                items: activity.length,
                last_page: !txData.pagination.has_more,
            },
        }
    }

    public async forTransaction(
        txHash: string,
        { chainId, page, limit }: CovalentConfig = {},
    ): Promise<ActivityData> {
        logger.startTimer('fetch')
        const txData = await Covalent.getTransactionFor(txHash, { chainId, page, limit })
        logger.endTimer('fetch')

        logger.startTimer('augmenting')
        const activity = await Promise.all(
            (
                await Augmenter.augmentAll(txData.items, { chainId: chainId ?? 1 })
            ).map(
                async (tx: TxData, i): Promise<ActivityEntry> => ({
                    id: tx.tx_hash,
                    raw: {
                        input: tx.data,
                        value: tx.value,
                        to: tx.to_address,
                        from: tx.from_address,
                        block: tx.block_height,
                        gas_units: tx.gas_spent,
                        gas_price: tx.gas_price,
                        reverted: !tx.successful,
                        timestamp: new Date(tx.block_signed_at).getTime() / 1000,
                    },
                    insights: await Augmenter.augment(tx, { chainId: chainId ?? 1 }),
                    explorer_url: `https://etherscan.io/tx/${tx.tx_hash}`,
                    value_in_eth: tx.value == '0' ? '0' : ethers.utils.formatUnits(tx.value),
                }),
            ),
        )
        logger.endTimer('augmenting')

        return {
            data: activity,
            // pagination: { page: page + 1, items: activity.length, last_page: !txData.pagination.has_more },
        }
    }
}

export default new Activity()
