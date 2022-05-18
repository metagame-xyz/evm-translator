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

    try {
        const method = await axios
            .get('https://www.4byte.directory/api/v1/signatures', { params: { hex_signature: hexSignature } })
            .then(({ data: { results } }) => results[results.length - 1]?.text_signature?.split('(')?.[0])

        return method
    } catch (err) {
        console.log('err', err)
        return ''
    }

    // return method
}

async function getEventSignature(hexSignature: string): Promise<string> {
    // if (this.#fnSigCache[hex_signature]) return this.#fnSigCache[hex_signature]

    const remaining = await limiter.removeTokens(1)

    if (remaining < 1) {
        console.log('4byte rate limiter engaged. tokens remaining:', remaining)
    }

    try {
        const method = await axios
            .get('https://www.4byte.directory/api/v1/event-signatures', { params: { hex_signature: hexSignature } })
            .then(({ data: { results } }) => results?.text_signature)

        return method
    } catch (err) {
        console.log('err', err)
        return ''
    }

    // return method
}

const fourByteDirectory = {
    getMethodSignature,
    getEventSignature,
}

export default fourByteDirectory
