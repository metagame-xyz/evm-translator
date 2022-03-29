const JuiceboxContribution = {
    contract_address: '0xd569d3cce55b71a8a3f3c418c329a66e5f714431',
    methods: {
        // from 4byte.directory
        0x02c8986f: ['pay', 'pay(uint256,address,string,bool)'],
        0x3015a5b5: ['redeem', 'redeem(address,uint256,uint256,uint256,address,bool)'],
    },
    contract_official_name: 'TerminalV1',
    contractName: 'Juicebox',
    pay: {
        action: 'contributed',
        project: {
            key: 'contract',
            filters: {
                event: 'Transfer',
                to: '{userAddress}',
            },
            prefix: 'the ',
            defaultValue: 'an unknown',
        },
        exampleDescriptionTemplate: `{userName} {action} {nativeTokenValueSent} ETH to {project} {contractName}`,
        exampleDescription: 'brenner.eth contributed 0.12 ETH  to the ConstitutionDAO Juicebox',
    },
}

export default JuiceboxContribution
