import { LogServiceInfo } from '@bemit/glog/LogManager'
import { Log } from '@google-cloud/logging'

export interface LogActionDataCommon {
    label?: string

    // the unique ID of this group of actions
    process?: string
    // the unique ID for this group of steps
    action: string
    // how many tries where before this execution
    retries?: number
    status?: string
    status_previous?: string
    // total number of steps in this action / step
    steps?: number
    // total done (not failed, not skipped) number of steps in this action / step
    steps_done?: number
    // total failed number of steps in this action / step
    steps_error?: number
    // total skipped number of steps in this action / step
    steps_skipped?: number

    // duration for all children-steps, including own root-step duration
    duration_total?: number

    attributes?: {
        [k: string]: string | number | boolean | null | undefined
    }
}

export interface LogActionData extends LogActionDataCommon {
    // the operation of the action, e.g. `folder.purge`
    action_op: string
}

export interface LogActionDataStep extends LogActionDataCommon {
    // the operation of the action, e.g. `folder.purge`
    step_op: string
    // the unique identifier for the current step in the action / in the step_parent
    step_index: number
    // a hierarchical ID build from the `step_index`
    step_parent?: string
    step_skipped?: boolean
    // only own step duration
    duration_step?: number
}

/**
 * @see https://cloud.google.com/monitoring/api/resources#tag_generic_task
 */
export interface LogActionMetaResourceLabels {
    // id for a task
    // task_id: string
    // id of related tasks
    // job?: string
    location?: string
    // namespace?: string
    // set from logger/Logging
    project_id: string
}

export interface LogActionMeta extends Omit<LogActionMetaResourceLabels, 'project_id'> {
    trace?: string
    span?: string
}

export type LogActionDataTypes = LogActionData | LogActionDataStep

export class LoggerAction<CM extends LogActionMeta = LogActionMeta> {
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

    public entry(
        meta: CM,
        data: LogActionDataTypes,
        labels?: { [k: string]: string },
    ) {
        const now = new Date()
        return {
            meta: {
                resource: {
                    type: 'generic_task',
                    labels: {
                        ...(this.serviceInfo?.service ? {
                            service: this.serviceInfo?.service,
                        } : {}),
                        ...(this.serviceInfo?.version ? {
                            version: this.serviceInfo?.version,
                        } : {}),
                        ...(meta.location ? {
                            location: meta.location,
                        } : {}),
                    },
                },
                labels: {
                    ...this.labelsDefault,
                    ...labels || {},
                },
                trace: meta.trace,
                spanId: meta.span,
            },
            data: {
                ...data,
                message:
                    'action_op' in data ?
                        data.action + ' _ /' + data.action_op :
                        data.action + ' ' + (data.step_parent || '_') + '#' + data.step_index + ' /' + data.step_op,
                ts_micro: now.getTime(),
                ts_iso: now.toISOString(),
            },
        }
    }

    public async write(
        entries: {
            meta: CM
            data: LogActionDataTypes
            labels?: { [k: string]: string }
        }[],
    ) {
        await this.logger.write(
            entries.map(
                ({meta, data, labels}) => {
                    const e = this.entry(meta, data, labels)
                    return this.logger.entry(e.meta, e.data)
                }
            ),
        )
    }
}
