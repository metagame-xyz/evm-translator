declare module 'eth-ens-namehash' {
    type Address = string
    function normalize(name: string): string
    function hash(name: string): string
}
