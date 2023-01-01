import { Log } from '@google-cloud/logging'

export const LoggerGlobal = (
    logger: Log,
    labelsDefault?: { [k: string]: string },
    resourceType: string = 'api',
    resourceLabelsDefault: { [k: string]: string } = {},
) => {
    const state: { closing: boolean, current: number, onEnd: (() => void)[] } = {
        current: 0,
        onEnd: [],
        closing: false,
    }
    const {incr, decr, end} = {
        incr: () => ++state.current,
        decr: () => {
            const open = --state.current
            if(open === 0 && state.closing) {
                end()
            }
        },
        end: () => state.onEnd.forEach(onEnd => onEnd()),
    }

    const defaultLoggers = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        debug: console.debug,
        info: console.info,
    }
    state.onEnd.push(() => {
        console.log = defaultLoggers.log
        console.warn = defaultLoggers.warn
        console.error = defaultLoggers.error
        console.debug = defaultLoggers.debug
        console.info = defaultLoggers.info
    })

    const consoleLogger = severity => (...entries: any[]) => {
        incr()
        logger.write(logger.entry({
            severity: severity || 'DEFAULT',
            resource: {
                type: resourceType,
                labels: resourceLabelsDefault,
            },
            labels: labelsDefault,
        }, {
            ...(typeof entries[0] === 'string' ?
                {
                    message: entries[0],
                    error_details: entries.slice(1),
                } : {
                    error_details: entries,
                }),
        }))
            .then(() => {
                decr()
            })
            .catch((err) => {
                process.stderr.write('LogGlobal can not log | ' + JSON.stringify({entries: entries, error: err}))
                decr()
            })
    }
    console.log = consoleLogger('DEFAULT')
    console.warn = consoleLogger('WARNING')
    console.error = consoleLogger('ERROR')
    console.debug = consoleLogger('DEBUG')
    console.info = consoleLogger('INFO')

    return () => new Promise<void>((resolve) => {
        state.closing = true
        state.onEnd.push(() => resolve())
        if(state.current === 0) {
            end()
        }
    })
}
