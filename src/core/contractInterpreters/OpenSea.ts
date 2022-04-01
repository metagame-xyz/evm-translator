const OpenSea = {
    contractAddress: '0x7f268357a8c2552623316e2562d90e642bb538e5',
    methods: {
        // from 4byte.directory
        '0x02c8986f': ['pay', 'pay(uint256,address,string,bool)'],
    },
    contractOfficialName: 'Wyvern Exchange Contract',
    contractName: 'OpenSea',
    writeFunctions: {
        atomicMatch_: {
            action: 'bought',
            keywords: {
                NFT: {
                    key: 'contract',
                    filters: {
                        event: 'Transfer',
                        to: '{userAddress}',
                    },
                    defaultValue: 'an unknown NFT',
                },
                tokenId: {
                    key: 'tokenId',
                    filters: {
                        event: 'Transfer',
                        to: '{userAddress}',
                    },
                    prefix: '#',
                    defaultValue: '???',
                },
            },
            exampleDescriptionTemplate: `{userName} {action} {NFT} {tokenId} on {contractName} for {nativeTokenValueSent} ETH`,
            exampleDescription: 'brenner.eth bought Blitmap #1115 on OpenSea for 0.01 ETH',
        },
    },
}

export default OpenSea
