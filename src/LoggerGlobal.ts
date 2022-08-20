import { Log } from '@google-cloud/logging'

export const LoggerGlobal = (
    logger: Log,
    labelsDefault?: { [k: string]: string },
    resourceType: string = 'api',
    resourceLabelsDefault: { [k: string]: string } = {},
) => {
    const consoleLogger = severity => (...entries: any[]) => {
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
            .then(() => undefined)
            .catch((err) => {
                process.stderr.write('LogGlobal can not log | ' + JSON.stringify({entries: entries, error: err}))
            })
    }
    console.log = consoleLogger('DEFAULT')
    console.warn = consoleLogger('WARNING')
    console.error = consoleLogger('ERROR')
    console.debug = consoleLogger('DEBUG')
    console.info = consoleLogger('INFO')
}
