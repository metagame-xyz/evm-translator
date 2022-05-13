import Translator, { createEthersAPIKeyObj, TranslatorConfig } from 'Translator'
import { chains } from 'utils'

jest.mock('node-fetch', () => jest.fn())

test('Translator', () => {
    expect(true).toEqual(true)
    const translatorConfig: TranslatorConfig = {
        chain: chains.ethereum,
        covalentApiKey: '',
        ethersApiKeys: createEthersAPIKeyObj('', '', '', '', ''),
    }
    expect(new Translator(translatorConfig)).toBeTruthy()
})
