import {
    Logging, Log,
    LoggingOptions,
} from '@google-cloud/logging'
import { LogEntry } from '@google-cloud/logging/build/src/entry'
import { WriteOptions } from '@google-cloud/logging/build/src/log'

export interface LogServiceInfo {
    // used as `resource.labels.service`
    service?: string
    // used as `resource.labels.version`
    version?: string
    logId: string
    logProject: string
}

export class LogManager {
    private readonly logging: Logging
    private logger: { [name: string]: Log } = {}
    public readonly serviceInfo: LogServiceInfo
    public readonly globalLabels: Readonly<{ [k: string]: string }>

    constructor(
        init: LoggingOptions,
        serviceInfo: LogServiceInfo,
        // labels intended for `meta: LogEntry['labels']`
        globalLabels: { [k: string]: string } = {},
    ) {
        this.logging = new Logging(init) as Logging
        this.serviceInfo = serviceInfo
        this.globalLabels = Object.freeze(globalLabels)
    }

    public getLogging(): Logging {
        return this.logging
    }

    public getLogger(name: string): Log {
        if(!this.logger[name]) {
            this.logger[name] = this.logging.log(name, {})
        }
        return this.logger[name]
    }

    public setLogger(name: string, logger: Log): void {
        if(this.logger[name]) {
            throw new Error('can not overwrite existing logger for: ' + name)
        }
        this.logger[name] = logger
    }

    public async write<D extends string | {}>(
        name: string,
        entries: {
            data: D
            meta: LogEntry
        }[],
        writeOptions?: WriteOptions,
    ) {
        const logger = this.getLogger(name)
        return await logger.write(
            entries.map(({data, meta}) =>
                logger.entry(meta, data),
            ),
            writeOptions,
        )
    }

    public makeTrace(traceId: string) {
        return 'projects/' + this.serviceInfo.logProject + '/traces/' + traceId as string
    }
}
