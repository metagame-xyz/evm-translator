const JuiceboxContribution = {
    contract_address: '0xd569d3cce55b71a8a3f3c418c329a66e5f714431',
    methods: {
        // from 4byte.directory
        0x02c8986f: ['pay', 'pay(uint256,address,string,bool)'],
        0x3015a5b5: ['redeem', 'redeem(address,uint256,uint256,uint256,address,bool)'],
    },
    contract_official_name: 'TerminalV1',
    contract_name: 'Juicebox',
    pay: {
        action: 'contributed',
        project: {
            key: 'contract',
            filters: {
                event: 'Transfer',
                to: '{user_address}',
            },
            prefix: 'the ',
            default_value: 'an unknown',
        },
        example_description_template: `{user_name} {action} {ether_sent} ETH to {project} {contract_name}`,
        example_description: 'brenner.eth contributed 0.12 ETH  to the ConstitutionDAO Juicebox',
    },
}

export default JuiceboxContribution
