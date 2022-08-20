import { LogServiceInfo } from '@bemit/glog/LogManager'
import { Log } from '@google-cloud/logging'
import { LogEntry } from '@google-cloud/logging/build/src/entry'

export interface LogApiData {
    // the default visible entry label
    message?: string

    [k: string]: any
}

/**
 * @see https://cloud.google.com/monitoring/api/resources#tag_api
 */
export interface LogApiMetaResourceLabels {
    method: string
    // set from `serviceInfo`
    service: string
    // set from `serviceInfo`
    version: string
    location?: string
    // set from logger/Logging
    project_id: string
}

/**
 * @see https://cloud.google.com/monitoring/api/resources#tag_consumed_api
 */
export interface LogApiMetaResourceLabelsConsumed extends LogApiMetaResourceLabels {
    credential_id?: string
}

/**
 * @see https://cloud.google.com/monitoring/api/resources#tag_produced_api
 */
export interface LogApiMetaResourceLabelsProduced extends LogApiMetaResourceLabels {
    consumer_id?: string
}

export interface LogApiMetaResourceLabelsTypes {
    api: Omit<LogApiMetaResourceLabels, 'service' | 'version' | 'project_id'>
    consumed_api: Omit<LogApiMetaResourceLabelsConsumed, 'service' | 'version' | 'project_id'>
    produced_api: Omit<LogApiMetaResourceLabelsProduced, 'service' | 'version' | 'project_id'>
}

export type LogApiMeta<T extends 'api' | 'consumed_api' | 'produced_api'> = LogApiMetaResourceLabelsTypes[T] & {
    trace?: string
    span?: string
}

export class LoggerApi<T extends 'api' | 'consumed_api' | 'produced_api', CD extends LogApiData = LogApiData> {
    protected readonly logger: Log
    public readonly serviceInfo: LogServiceInfo
    public readonly resourceType: T
    public readonly labelsDefault: { [k: string]: string }
    protected readonly messageServiceSuffix: string

    constructor(
        logger: Log,
        serviceInfo: LogServiceInfo,
        resourceType: T,
        labelsDefault: { [k: string]: string } = {},
        messageServiceSuffix: string = '/api/',
    ) {
        this.logger = logger
        this.serviceInfo = serviceInfo
        this.resourceType = resourceType
        this.labelsDefault = labelsDefault
        this.messageServiceSuffix = messageServiceSuffix
    }

    public async write(
        entries: {
            meta: LogApiMeta<T> & Omit<LogEntry, 'resource' | 'labels' | 'trace' | 'spanId'>
            data: CD
            labels?: { [k: string]: string }
        }[],
    ) {
        await this.logger.write(entries.map((
            (
                {
                    meta: {
                        method, location, trace, span,
                        // @ts-ignore
                        credential_id, consumer_id,
                        ...metaRest
                    },
                    data, labels,
                }
            ) => this.logger.entry(
                {
                    resource: {
                        type: this.resourceType,
                        labels: {
                            ...(this.serviceInfo?.service ? {
                                service: this.serviceInfo?.service,
                            } : {}),
                            ...(this.serviceInfo?.version ? {
                                version: this.serviceInfo?.version,
                            } : {}),
                            ...(method ? {
                                method: method,
                            } : {}),
                            ...(location ? {
                                location: location,
                            } : {}),
                            ...(credential_id ? {
                                credential_id: credential_id,
                            } : {}),
                            ...(consumer_id ? {
                                consumer_id: consumer_id,
                            } : {}),
                        },
                    },
                    labels: {
                        app_env: this.serviceInfo?.app_env as string,
                        ...this.labelsDefault,
                        ...labels || {},
                    },
                    trace: trace,
                    spanId: span,
                    ...metaRest,
                },
                {
                    ...data,
                    message: data.message || ((this.serviceInfo?.service ? this.serviceInfo?.service + this.messageServiceSuffix : '') + method),
                },
            ))))
    }
}
