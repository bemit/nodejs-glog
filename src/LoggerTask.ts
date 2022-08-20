import { LogServiceInfo } from '@bemit/glog/LogManager'
import { Log } from '@google-cloud/logging'

export interface LogTaskData {
    // the default visible entry label
    message?: string

    [k: string]: any
}

/**
 * @see https://cloud.google.com/monitoring/api/resources#tag_generic_task
 */
export interface LogTaskMetaResourceLabels {
    // id for a task
    task_id: string
    // id of related tasks
    job?: string
    location?: string
    namespace?: string
    // set from logger/Logging
    project_id: string
}

export interface LogTaskMeta extends Omit<LogTaskMetaResourceLabels, 'project_id'> {
    status: string
    trace?: string
    span?: string
}

export class LoggerTask<CD extends LogTaskData = LogTaskData, CM extends LogTaskMeta = LogTaskMeta> {
    protected readonly logger: Log
    public readonly serviceInfo: LogServiceInfo
    public readonly labelsDefault: { [k: string]: string }

    constructor(
        logger: Log,
        serviceInfo: LogServiceInfo,
        labelsDefault: { [k: string]: string } = {},
    ) {
        this.logger = logger
        this.serviceInfo = serviceInfo
        this.labelsDefault = labelsDefault
    }

    public async write<CDD extends Omit<CD, 'task_id' | 'status'>>(
        entries: {
            meta: CM
            data: CDD
            labels?: { [k: string]: string }
        }[],
    ) {
        await this.logger.write(entries.map((({meta, data, labels}) => this.logger.entry(
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
                        task_id: meta.task_id,
                        ...(meta.job ? {
                            job: meta.job,
                        } : {}),
                        ...(meta.location ? {
                            location: meta.location,
                        } : {}),
                        ...(meta.namespace ? {
                            namespace: meta.namespace,
                        } : {}),
                    },
                },
                labels: {
                    app_env: this.serviceInfo?.app_env as string,
                    ...this.labelsDefault,
                    ...labels || {},
                },
                trace: meta.trace,
                spanId: meta.span,
            },
            {
                ...data,
                job: meta.job,
                task_id: meta.task_id,
                status: meta.status,
                ...(meta.location ? {
                    location: meta.location,
                } : {}),
                ...(meta.namespace ? {
                    namespace: meta.namespace,
                } : {}),
                message: data.message || (meta.task_id + '/' + meta.status),
            },
        ))))
    }
}
