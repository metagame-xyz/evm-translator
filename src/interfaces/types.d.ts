declare module 'eth-ens-namehash' {
    type Address = `0x${string}`
    function normalize(name: string): string
    function hash(name: string): Address
}
