import { Address, RawTxData } from '@interfaces'
import { CovalentTxData } from '@interfaces/covalent'

export function covalentToRawTxData(rawCovalentData: CovalentTxData): RawTxData {
    const rawtxData: RawTxData = {
        txHash: rawCovalentData.tx_hash,
        txIndex: rawCovalentData.tx_offset,
        to: rawCovalentData.to_address,
        from: rawCovalentData.from_address,
        block: rawCovalentData.block_height,
        value: rawCovalentData.value,
        timestamp: rawCovalentData.block_signed_at,
        gas_units: rawCovalentData.gas_spent,
        gas_price: rawCovalentData.gas_price,
        successful: rawCovalentData.successful,
        input: rawCovalentData.data || null,
        log_events: rawCovalentData.log_events.map((log) => ({
            address: log.sender_address as Address,
            topics: log.raw_log_topics,
            data: log.raw_log_data,
            logIndex: log.log_offset,
        })),
    }

    return rawtxData
}
