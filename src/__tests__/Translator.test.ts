import { chains } from '@utils'
import Translator, { createEthersAPIKeyObj, TranslatorConfig } from 'Translator'

test('Translator', () => {
    const translatorConfig: TranslatorConfig = {
        chain: chains.ethereum,
        covalentApiKey: '',
        ethersApiKeys: createEthersAPIKeyObj('', '', '', '', ''),
    }
    expect(new Translator(translatorConfig)).toBeTruthy()
})
