const OpenSea = {
    contract_address: '0x7f268357a8c2552623316e2562d90e642bb538e5',
    methods: {
        // from 4byte.directory
        0x02c8986f: ['atomicMatch_', 'pay(uint256,address,string,bool)'],
    },
    contract_official_name: 'Wyvern Exchange Contract',
    contract_name: 'OpenSea',
    atomicMatch_: {
        action: 'bought',
        NFT: {
            key: 'contract',
            filters: {
                event: 'Transfer',
                to: '{user_address}',
            },
            default_value: 'an unknown NFT',
        },
        tokenId: {
            key: 'tokenId',
            filters: {
                event: 'Transfer',
                to: '{user_address}',
            },
            prefix: '#',
            default_value: '???',
        },
        example_description_template: `{user_name} {action} {NFT} {tokenId} on {contract_name} for {ether_sent} ETH`,
        // example_description: 'brenner.eth bought Blitmap #1115 on OpenSea for 0.01 ETH',
    },
}

export default OpenSea
