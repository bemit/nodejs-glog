import { LogServiceInfo } from '@bemit/glog/LogManager'
import { Log } from '@google-cloud/logging'
import { LogEntry } from '@google-cloud/logging/build/src/entry'

export interface LogQuotaData {
    // id for the quota
    quota: string
    // the issued amount towards the total
    amount?: number
    // the total used of the quota, including the currently issued one
    amount_total?: number
    // if available, unit of the issued amount/total
    unit?: string

    // the default visible entry label
    message?: string

    [k: string]: any
}

/**
 * @see https://cloud.google.com/monitoring/api/resources#tag_generic_task
 */
export interface LogQuotaMetaResourceLabels {
    // id for a task
    task_id?: string
    // id of related tasks
    job?: string
    location?: string
    namespace?: string
    // set from logger/Logging
    project_id: string
}

export type LogQuotaMeta = Omit<LogQuotaMetaResourceLabels, 'project_id'> & {
    trace?: string
    span?: string
}

export class LoggerQuota<CD extends LogQuotaData = LogQuotaData> {
    protected readonly logger: Log
    public readonly serviceInfo: LogServiceInfo
    public readonly labelsDefault: { [k: string]: string }
    protected readonly messageServiceSuffix: string

    constructor(
        logger: Log,
        serviceInfo: LogServiceInfo,
        labelsDefault: { [k: string]: string } = {},
        messageServiceSuffix: string = '/quota/',
    ) {
        this.logger = logger
        this.serviceInfo = serviceInfo
        this.labelsDefault = labelsDefault
        this.messageServiceSuffix = messageServiceSuffix
    }

    public async write(
        entries: {
            meta: LogQuotaMeta & Omit<LogEntry, 'resource' | 'labels' | 'trace' | 'spanId'>
            data: CD
            labels?: { [k: string]: string }
        }[],
    ) {
        await this.logger.write(entries.map((
            (
                {
                    meta: {
                        location, trace, span,
                        task_id, namespace, job,
                        ...metaRest
                    },
                    data, labels,
                }
            ) => this.logger.entry(
                {
                    resource: {
                        type: 'generic_task',
                        labels: {
                            ...(this.serviceInfo?.service ? {
                                service: this.serviceInfo?.service,
                            } : {}),
                            ...(this.serviceInfo?.version ? {
                                version: this.serviceInfo?.version,
                            } : {}),
                            ...(location ? {
                                location: location,
                            } : {}),
                            ...(task_id ? {
                                task_id: task_id,
                            } : {}),
                            ...(namespace ? {
                                namespace: namespace,
                            } : {}),
                            ...(job ? {
                                job: job,
                            } : {}),
                        },
                    },
                    labels: {
                        ...this.labelsDefault,
                        ...labels || {},
                    },
                    trace: trace,
                    spanId: span,
                    ...metaRest,
                },
                {
                    ...data,
                    message: data.message || ((this.serviceInfo?.service ? this.serviceInfo?.service + this.messageServiceSuffix : '') + data.quota),
                },
            ))))
    }
}
