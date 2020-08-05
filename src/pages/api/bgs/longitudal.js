import { Duration, DateTime } from 'luxon'
import { fetchSgvs } from '../../../api'
import { authMiddleware } from '../../../api/middleware'

export default async (req, res) => {
    const user = await authMiddleware(req, res)
    const tz = req.query.tz
    if(!tz) {
        throw new Error(`Request must specify a timezone using tz`)
    }

    const DAYS_TO_RETRIEVE = 7*5 // 5 weeks
    let today = DateTime.local().setZone(tz)
    let toDate = today
    let fromDate = toDate
        .minus({ days: DAYS_TO_RETRIEVE-1 })
        .set({
            hour: 0,
            minute: 0,
            second: 0,
            millisecond: 0
        })
    
    let range = [fromDate, toDate].map(x => DateTime.fromJSDate(new Date(x)))
    const data = await fetchSgvs(user, range)

    res.status(200).json(data)
}