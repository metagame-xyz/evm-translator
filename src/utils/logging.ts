// import DatadogWinston from 'datadog-winston';
import winston, { format } from 'winston'

// import { DATADOG_API_KEY } from './constants';

const { combine, printf, colorize, errors } = format

const colors = {
    error: 'red',
    warning: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
}

winston.addColors(colors)

const devFormat = printf((info) => `${info.level}: ${info.message}`)

const debugFormat = format.prettyPrint()

const prodFormat = printf((d) => {
    const txHash = d.txHash ? `${d.txHash}` : 'unknown txHash'
    const address = d.address ? ` | ${d.address}` : ' | unknown address'
    const message = d.message ? ` | ${d.message}` : ''
    const error = d.error ? ` | ${d.error}` : ''

    return `${d.level}: ${txHash}${address}${message}${error}`
})
// const prodFormat = printf(
//     (d) =>
//         `${d.level}: token_id ${d.token_id} | ${d.function_name} | ${
//             d.third_party_name ? `${d.third_party_name} | ` : ''
//         }${d.attempt_number ? `attempt ${d.attempt_number} | ` : ''}${d.message}`,
// )
const localTransports = [
    new winston.transports.Console({ level: 'debug' }),
    new winston.transports.File({ level: 'info', filename: 'logs/info.log' }),
]

// const service =
//     process.env.VERCEL_ENV === 'production' ? 'evm-translator-logger' : 'evm-translator-dev-logger';

// const service = process.env.NODE_ENV === 'production' ? 'evm-translator-logger' : 'evm-translator-dev-logger'

// const datadogTransport = new DatadogWinston({
//     apiKey: DATADOG_API_KEY,
//     hostname: 'vercel',
//     service,
//     ddsource: 'nodejs',
//     ddtags: `env:${process.env.VERCEL_ENV}, git_sha:${process.env.VERCEL_GIT_COMMIT_SHA}, git_ref:${process.env.VERCEL_GIT_COMMIT_REF}`,
// });

const prodTransports = [new winston.transports.Console({ level: 'debug' })]

const isProdEnv = process.env.NODE_ENV === 'production'

export const winstonLogger = winston.createLogger({
    levels: winston.config.syslog.levels,
    format: isProdEnv ? prodFormat : combine(colorize(), prodFormat),
    transports: isProdEnv ? prodTransports : localTransports,
})

export const debugLogger = winston.createLogger({
    levels: winston.config.syslog.levels,
    format: devFormat,
    transports: isProdEnv ? prodTransports : localTransports,
})

// export const logger = isProdEnv ? winstonLogger : console
export const logger = winstonLogger

export const debug = (message: any) => {
    debugLogger.debug(message)
}

export const logDebug = (logData: LogData, message: any) => {
    const logDataCopy = { ...logData, level: 'debug', message }
    logger.log(logDataCopy)
}
export const logInfo = (logData: LogData, message: any) => {
    const logDataCopy = { ...logData, level: 'info', message }
    logger.log(logDataCopy)
}

export const logWarning = (logData: LogData, message: any) => {
    const logDataCopy = { ...logData, level: 'warning', message }
    logger.log(logDataCopy)
}
export const logError = (logData: LogData, message: any) => {
    const logDataCopy = { ...logData, level: 'error', message }
    logger.log(logDataCopy)
}
// export const logError = (logData: LogData, error: any, alert = false) => {
//     const logDataCopy = {
//         ...logData,
//         level: 'error',
//         message: error?.message || 'error obj had no .message',
//         alert,
//     }
//     logDataCopy.thrown_error = error
//     logger.log(logDataCopy)
// }

export const logSuccess = (logData: LogData, message = 'success') => {
    const logDataCopy = { ...logData, level: 'info', message }
    delete logDataCopy.third_party_name
    logger.log(logDataCopy)
}

export type LogData = {
    level?: 'emerg' | 'alert' | 'crit' | 'error' | 'warning' | 'notice' | 'info' | 'debug'
    attempt_number?: number
    message?: any
    third_party_name?: string
    txHash?: string
    address?: string
    function_name?: string
    thrown_error?: any
    seconds_elapsed?: number
    extra?: any
}
// export type LogData = {
//     level?: 'emerg' | 'alert' | 'crit' | 'error' | 'warning' | 'notice' | 'info' | 'debug'
//     retry_needed?: boolean
//     attempt_number?: number
//     error_code?: number
//     message?: any
//     third_party_name?: string
//     wallet_address?: string
//     token_id?: string
//     function_name?: string
//     thrown_error?: any
//     job_data?: any
//     alert?: boolean
//     seconds_elapsed?: number
//     extra?: any
// }

export type LogDataWithLevelAnd = LogData & {
    level: 'emerg' | 'alert' | 'crit' | 'error' | 'warning' | 'notice' | 'info' | 'debug'
    message: any
}
