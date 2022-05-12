declare module 'eth-ens-namehash' {
    type Address = `0x${string}`
    function normalize(name: string): string
    function hash(name: string): Address
}

declare module 'abi-decoder' {
    function addABI(abi: any[]): void
    function decodeLogs(logs: any[]): Omit<import('interfaces').RawDecodedLog[], 'logIndex' | 'decoded'>
    function decodeMethod(data: string): import('interfaces').RawDecodedCallData
}

// declare module 'utils/web3-abi-coder' {
//     function encodeFunctionSignature(functionName: string | import('web3-utils').AbiItem): string

//     function encodeEventSignature(functionName: string | import('web3-utils').AbiItem): string

//     function encodeParameter(type: any, parameter: any): string

//     function encodeParameters(types: any[], paramaters: any[]): string

//     function encodeFunctionCall(abiItem: import('web3-utils').AbiItem, params: string[]): string

//     function decodeParameter(type: any, hex: string): { [key: string]: any }

//     function decodeParameters(types: any[], hex: string): { [key: string]: any }

//     function decodeLog(
//         inputs: import('web3-utils').AbiInput[],
//         hex: string,
//         topics: string[],
//     ): { [key: string]: string }
// }
