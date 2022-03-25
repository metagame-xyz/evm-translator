import Translator, { TranslatorConfig } from '../Translator'
import { chains } from '../utils'

test('Translator', () => {
    const translatorConfig: TranslatorConfig = {
        chain: chains.ethereum,
        covalentApiKey: '',
    }
    expect(new Translator(translatorConfig)).toBeTruthy()
})
