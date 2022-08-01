import {
    Logging as LoggingType,
    Log as LoggerTypeG,
    Entry as LogEntryTypeG,
} from '@google-cloud/logging'
import GCloud from '@google-cloud/logging/build/src/index.js'

const {Logging, Entry} = GCloud

export const LogEntry = Entry

export type LogApiResponse = [any]
export type LoggerType = LoggerTypeG
export type LogEntryType = LogEntryTypeG

export class LogManager {
    private readonly logging: LoggingType
    private logger: { [name: string]: LoggerType } = {}

    constructor(init: {
        keyFilename: string
    }) {
        this.logging = new Logging(init) as LoggingType
    }

    public getLogging(): LoggingType {
        return this.logging
    }

    public getLogger(name: string): LoggerType {
        if(!this.logger[name]) {
            this.logger[name] = this.logging.log(name, {})
        }
        return this.logger[name]
    }

    public bindToGlobal(
        serviceId: string,
        name: string,
        version?: string,
        labelsDefault?: { [k: string]: string },
        resourceType: string = 'api',
    ) {
        const logger = this.getLogger(name)
        const consoleLogger = severity => (...entries: any[]) => {
            logger.write(logger.entry({
                severity: severity || 'DEFAULT',
                resource: {
                    type: resourceType,
                    labels: {
                        service: serviceId,
                        ...(version ? {
                            version: version,
                        } : {}),
                    },
                },
                labels: labelsDefault,
            }, {
                ...(typeof entries[0] === 'string' ?
                    {
                        message: entries[0],
                        error_details: [
                            ...entries.slice(1),
                        ],
                    } : {
                        error_details: entries,
                    }),
            })).then(() => undefined).catch(() => undefined)
        }
        console.log = consoleLogger('DEFAULT')
        console.warn = consoleLogger('WARNING')
        console.error = consoleLogger('ERROR')
        console.debug = consoleLogger('DEBUG')
        console.info = consoleLogger('INFO')
    }
}
