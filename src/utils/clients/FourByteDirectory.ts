import axios from 'axios'
import { RateLimiter } from 'limiter'

// 'second', 'minute', 'day', or a number of milliseconds
const limiter = new RateLimiter({ tokensPerInterval: 10, interval: 'second' })

async function getMethodSignature(hexSignature: string): Promise<string> {
    // if (this.#fnSigCache[hex_signature]) return this.#fnSigCache[hex_signature]

    const remaining = await limiter.removeTokens(1)

    if (remaining < 1) {
        console.log('4byte rate limiter engaged. tokens remaining:', remaining)
    }

    const method = await axios
        .get('https://www.4byte.directory/api/v1/signatures', { params: { hex_signature: hexSignature } })
        .then(({ data: { results } }) => results[results.length - 1]?.text_signature?.split('(')?.[0])

    return method
}

const fourByteDirectory = {
    getMethodSignature,
}

export default fourByteDirectory
