import axios from 'axios'

async function getMethodSignature(hexSignature: string): Promise<string> {
    // if (this.#fnSigCache[hex_signature]) return this.#fnSigCache[hex_signature]

    const method = await axios
        .get('https://www.4byte.directory/api/v1/signatures', { params: { hex_signature: hexSignature } })
        .then(({ data: { results } }) => results[results.length - 1]?.text_signature?.split('(')?.[0])

    return method
}

const fourByteDirectory = {
    getMethodSignature,
}

export default fourByteDirectory
