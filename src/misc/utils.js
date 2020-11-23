const { DateTime } = require("luxon");


export function startOfDay(time) {
    return DateTime.fromMillis(time).startOf('day')
}

export function getDateRangeOfOneDay(time) {
    const startTime = startOfDay(time)
    const endTime = startTime.plus({ days: 1 })
    return [startTime, endTime].map(d => d.toMillis())
}