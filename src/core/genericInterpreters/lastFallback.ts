import { Address } from 'eth-ens-namehash'
import { Action, Decoded, Interpretation } from 'interfaces'

function isAirdrop(interpretation: Interpretation, userAddress: Address, fromAddress: Address) {
    if (interpretation.tokensReceived.length > 0 && userAddress !== fromAddress) {
        return true
    }
}

function getAction(interpretation: Interpretation, userAddress: Address, fromAddress: Address): Action {
    if (isAirdrop(interpretation, userAddress, fromAddress)) {
        return Action.gotAirdropped
    }

    return Action.______TODO______
}

function lastFallback(decodedData: Decoded, interpretation: Interpretation, userAddress: Address) {
    const { fromAddress } = decodedData

    interpretation.action = getAction(interpretation, userAddress, fromAddress)

    if (interpretation.action === 'got airdropped') {
        interpretation.counterpartyName = fromAddress
        interpretation.exampleDescription = `${interpretation.userName} ${interpretation.action} ${interpretation.tokensReceived[0].symbol} from ${interpretation.counterpartyName}`
    }
}

export default lastFallback

/**
0xe8e0b0e5a46a21beef5b8d73753a306f737aa932e30614ec3c416e8d6effe878
"traded weth for car"

{
"nativeTokenValueSent":"0"
"tokensReceived":[
0:{
"type":"ERC721"
"name":"CAR"
"symbol":"CAR"
"address":"0xa80617371a5f511bf4c1ddf822e6040acaa63e71"
"tokenId":"746"
}
]
"tokensSent":[
0:{
"type":"ERC20"
"name":"Wrapped Ether"
"symbol":"WETH"
"address":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
"amount":"0.369"
}
]
"nativeTokenSymbol":"ETH"
"userName":"brenner.eth"
"gasPaid":"0.010657716082272324"
"extra":{}
}

 */
