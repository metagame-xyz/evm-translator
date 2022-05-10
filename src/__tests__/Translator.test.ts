import Translator, { createEthersAPIKeyObj, TranslatorConfig } from 'Translator'
import { chains } from 'utils'

jest.mock('node-fetch', () => jest.fn())

test('Translator', () => {
    const translatorConfig: TranslatorConfig = {
        chain: chains.ethereum,
        covalentApiKey: '',
        ethersApiKeys: createEthersAPIKeyObj('', '', '', '', ''),
    }
    expect(new Translator(translatorConfig)).toBeTruthy()
})
