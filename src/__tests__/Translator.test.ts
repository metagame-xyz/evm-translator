import Translator, { createEthersAPIKeyObj, TranslatorConfig } from 'Translator'
import { chains } from 'utils'

test('Translator', () => {
    const translatorConfig: TranslatorConfig = {
        chain: chains.ethereum,
        covalentApiKey: '',
        ethersApiKeys: createEthersAPIKeyObj('', '', '', '', ''),
    }
    expect(new Translator(translatorConfig)).toBeTruthy()
})
