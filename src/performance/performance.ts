// converted from `second + nanosecond` to `ms`
export const getPerformanceInMs = (elapsedTime: [number, number]): number => parseInt((((elapsedTime[0] * 1e9) + elapsedTime[1]) / 1e6).toFixed(0))


/**
 * Get time in `ms` since start of tag and when calling the `end` cb
 */
export const performanceTag = () => {
    const startTime = process.hrtime()
    return (): number => {
        // todo: maybe checking if called multiple times? but sometimes it may be wanted to know multiple ends for one start?
        const now = process.hrtime(startTime)
        return getPerformanceInMs(now)
    }
}
