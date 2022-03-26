import { chains } from '@utils'
import Translator, { TranslatorConfig } from 'Translator'

test('Translator', () => {
    const translatorConfig: TranslatorConfig = {
        chain: chains.ethereum,
        covalentApiKey: '',
    }
    expect(new Translator(translatorConfig)).toBeTruthy()
})
