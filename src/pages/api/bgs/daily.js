import { Duration, DateTime } from 'luxon'
import { fetchNightscoutData } from '../../../api'
import { authMiddleware } from '../../../api/middleware'

export default async (req, res) => {
    const user = await authMiddleware(req, res)

    // Split data into day-by-day view.
    const DAYS_TO_RETRIEVE = 14
    let referenceDate = DateTime.local()
        .minus({ days: DAYS_TO_RETRIEVE-1 })
        .set({
            hour: 0,
            minute: 0,
            second: 0,
            millisecond: 0
        })
    let date = referenceDate
    let days = []
    for(let i = 0; i < DAYS_TO_RETRIEVE; i++) {
        date = date.plus({ days: 1 })
        days.push(date)
    }

    // Now request data for all days.
    let ranges = []
    days.reduce((prev, curr) => {
        ranges.push([prev,curr])
        return curr
    })

    ranges = ranges.reverse()
    
    const datums = ranges.map(async range => {
        const data = await fetchNightscoutData(user, range)
        return {
            from: range[0].toString(),
            to: range[1].toString(),
            ...data
        }
    })

    res.status(200).json(
        await Promise.all(datums)
    )   
}