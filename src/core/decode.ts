import { Decoded, RawTxData } from '@interfaces'
import { CovalentTxData } from '@interfaces/covalent'

export type DecoderConfig = {
    covalentData?: CovalentTxData
    useNodeForENS: boolean
    use4ByteDirectory: boolean
    useTinTin: boolean
}

export function decode(rawTxData: RawTxData, config: DecoderConfig): Decoded {
    const decodedData = {} as Decoded

    return decodedData
}
