import fs from 'fs'
import { expect, describe, test } from '@jest/globals'
import { LogManager } from '@bemit/glog/LogManager'
import { LoggerTask } from '@bemit/glog/LoggerTask'
import { LoggerApi } from '@bemit/glog/LoggerApi'
import { LoggerQuota } from '@bemit/glog/LoggerQuota'
import { LogActionDataStep, LoggerAction } from '@bemit/glog/LoggerAction'

if(process.env.GLOUD_LOG_KEY) {
    fs.writeFileSync('_auth-cloud.json', process.env.GLOUD_LOG_KEY)
}
const logProject = 'bserve-cloud'
const logId = 'ci-oss'
const logService = 'github-nodejs-glog'
describe('LogManager', () => {
    test('Can be created', async() => {
        const logManager = new LogManager({projectId: logProject}, {logProject, logId})
        logManager.setLogger('default', logManager.getLogger(logId))
        expect(logManager).toBeInstanceOf(LogManager)
    })

    test('Can write entry', async() => {
        const logManager = new LogManager({
            projectId: logProject,
            keyFilename: '_auth-cloud.json',
        }, {logProject, logId, service: logService})
        logManager.setLogger('default', logManager.getLogger(logId))
        await logManager.write('default', [{
            meta: {},
            data: {message: 'test ' + new Date().toISOString()},
        }])
        expect(true).toBe(true)
    })

    test('Can write task entry', async() => {
        const logManager = new LogManager({
            projectId: logProject,
            keyFilename: '_auth-cloud.json',
        }, {logProject, logId, service: logService})
        logManager.setLogger('default', logManager.getLogger(logId))
        const loggerTask = new LoggerTask(logManager.getLogger('default'), logManager.serviceInfo)
        await loggerTask.write([{
            meta: {
                job: 'test',
                task_id: 'test-task-log',
                status: 'running',
            },
            data: {
                message: 'test-task ' + new Date().toISOString(),
                genericA: Math.floor(Math.random() * (150 - 15 + 1)) + 15,
            },
        }])
        expect(true).toBe(true)
    })

    test('Can write api entry', async() => {
        const logManager = new LogManager({
            projectId: logProject,
            keyFilename: '_auth-cloud.json',
        }, {logProject, logId, service: logService})
        logManager.setLogger('default', logManager.getLogger(logId))
        const loggerApi = new LoggerApi(logManager.getLogger('default'), logManager.serviceInfo, 'api')
        await loggerApi.write([{
            meta: {
                method: 'test',
            },
            data: {
                message: 'test-api-fn ' + new Date().toISOString(),
                genericA: Math.floor(Math.random() * (150 - 15 + 1)) + 15,
            },
        }])
        expect(true).toBe(true)
    })

    test('Can write quota entry', async() => {
        const logManager = new LogManager({
            projectId: logProject,
            keyFilename: '_auth-cloud.json',
        }, {logProject, logId, service: logService})
        logManager.setLogger('default', logManager.getLogger(logId))
        const loggerQuota = new LoggerQuota(logManager.getLogger('default'), logManager.serviceInfo)
        await loggerQuota.write([{
            meta: {},
            data: {
                message: 'quota ' + new Date().toISOString(),
                quota: 'test-run',
                amount: 1,
            },
        }])
        expect(true).toBe(true)
    })

    test('Can write action entry', async() => {
        const logManager = new LogManager({
            projectId: logProject,
            keyFilename: '_auth-cloud.json',
        }, {logProject, logId, service: logService})
        logManager.setLogger('default', logManager.getLogger(logId))
        const loggerAction = new LoggerAction(logManager.getLogger('default'), logManager.serviceInfo)
        // use correct calculated ID in production, e.g. nanoid, uuid
        const tsP = new Date().getTime().toString().slice(-6)
        const tsA = new Date().getTime().toString().slice(-9)
        await loggerAction.write([
            {
                meta: {},
                data: {
                    process: 'T' + tsP,
                    action: 'TA' + tsA,
                    action_op: 'test-action',
                    label: 'test action',
                    status: 'running',
                    status_previous: 'none',
                    steps: 1,
                },
            },
            {
                meta: {},
                data: {
                    process: 'T' + tsP,
                    action: 'TA' + tsA,
                    status: 'running',
                    status_previous: 'none',
                    step_op: 'test-action-step',
                    step_index: 0,
                    step_parent: undefined,
                    step_skipped: false,
                    attributes: {},
                },
            },
            {
                meta: {},
                data: ((durRand = Math.floor(Math.random() * (150 - 15 + 1)) + 15): LogActionDataStep => ({
                    process: 'T' + tsP,
                    action: 'TA' + tsA,
                    status: 'done',
                    status_previous: 'running',
                    step_op: 'test-action-step',
                    step_index: 0,
                    step_parent: undefined,
                    step_skipped: false,
                    duration_step: durRand,
                    duration_total: durRand,
                    attributes: {},
                }))(),
            },
            {
                meta: {},
                data: {
                    process: 'T' + tsP,
                    action: 'TA' + tsA,
                    action_op: 'test-action',
                    label: 'test action',
                    status: 'done',
                    status_previous: 'running',
                    steps: 1,
                    steps_done: 1,
                    // todo: here also the duration should be used
                },
            },
        ])
        expect(true).toBe(true)
    })
})
