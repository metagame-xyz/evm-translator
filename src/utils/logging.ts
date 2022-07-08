import DatadogWinston from 'datadog-winston'
import winston, { format } from 'winston'

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

const timingFormat = printf((d) => {
    let type = 'unknown type'
    let val = null
    if (d.eventHash) {
        type = 'eventHash'
        val = `${d.address} | ${d.eventHash}`
    } else if (d.methodHash) {
        type = 'methodHash'
        val = `${d.address} | ${d.methodHash}`
    } else if (d.txHash) {
        type = 'txHash'
        val = d.txHash
    } else if (d.blockNumber) {
        type = 'blockNumber'
        val = d.blockNumber
    } else if (d.address) {
        type = 'address'
        val = d.address
    } else if (d.secondsElapsed) {
        type = 'timer'
        val = d.secondsElapsed
    }
    // const txHash = d.txHash ? `${d.txHash}` : 'unknown txHash'
    // const address = d.address ? ` | ${d.address}` : ' | unknown address'
    const message = d.message ? ` | ${d.message}` : ''
    const error = d.error ? ` | ${d.error}` : ''
    const extra = d.extra ? ` | ${d.extra}` : ''

    return `${d.level}: ${type}: ${val} ${message}${error}${extra}`
})

const service = process.env.VERCEL_ENV === 'production' ? 'metabot-logger' : 'metabot-dev-logger'

const prodTransports = process.env.DATADOG_API_KEY
    ? [
          new DatadogWinston({
              apiKey: process.env.DATADOG_API_KEY,
              hostname: 'vercel',
              service,
              ddsource: 'nodejs',
              ddtags: `env:${process.env.VERCEL_ENV}, git_sha:${process.env.VERCEL_GIT_COMMIT_SHA}, git_ref:${process.env.VERCEL_GIT_COMMIT_REF}`,
          }),
      ]
    : []

const localTransports: any = [new winston.transports.Console({ level: 'debug' })]

const timerTransports = []

const isProdEnv = process.env.NODE_ENV === 'production'

if (!isProdEnv) {
    localTransports.push(new winston.transports.File({ level: 'warning', filename: 'logs/warnings.log' }))
    localTransports.push(new winston.transports.File({ level: 'error', filename: 'logs/errors.log' }))
    // localTransports.push(new winston.transports.File({ level: 'info', filename: 'logs/info.log' }))
    timerTransports.push(new winston.transports.File({ level: 'debug', filename: 'logs/timers.log' }))
}

export const winstonLogger = winston.createLogger({
    levels: winston.config.syslog.levels,
    format: debugFormat,
    transports: isProdEnv ? prodTransports : localTransports,
})

export const timingLogger = winston.createLogger({
    levels: winston.config.syslog.levels,
    format: debugFormat,
    transports: isProdEnv ? undefined : timerTransports,
})

// export const debugLogger = winston.createLogger({
//     levels: winston.config.syslog.levels,
//     format: devFormat,
//     transports: isProdEnv ? prodTransports : localTransports,
// })

// export const logger = isProdEnv ? winstonLogger : console
export const logger = winstonLogger

export const logTimer = (logData: LogData, message?: any) => {
    const data = { ...logData, level: 'info', message }
    timingLogger.log(data)
}

// export const debug = (message: any) => {
//     debugLogger.debug(message)
// }

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
// export const logError = (logData: LogData, message: any) => {
//     const logDataCopy = { ...logData, level: 'error', message }
//     logger.log(logDataCopy)
// }
export const logError = (logData: LogData, error: any, alert = false) => {
    const logDataCopy = {
        ...logData,
        level: 'error',
        message: error?.message || 'error obj had no .message',
        alert,
    }
    logDataCopy.thrown_error = error
    logger.log(logDataCopy)
}

export const logSuccess = (logData: LogData, message = 'success') => {
    const logDataCopy = { ...logData, level: 'info', message }
    logger.log(logDataCopy)
}

export type LogData = {
    level?: 'emerg' | 'alert' | 'crit' | 'error' | 'warning' | 'notice' | 'info' | 'debug'
    tx_hash?: string
    address?: string
    message?: any
    event_hash?: string
    method_hash?: string
    seconds_elapsed?: number
    thrown_error?: any
    extra?: any
    function_name?: string
    log_item?: any
    abi_item?: any
    method_id?: string
    method_data?: string
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

// const prodFormat = printf(
//     (d) =>
//         `${d.level}: token_id ${d.token_id} | ${d.function_name} | ${
//             d.third_party_name ? `${d.third_party_name} | ` : ''
//         }${d.attempt_number ? `attempt ${d.attempt_number} | ` : ''}${d.message}`,
// )
