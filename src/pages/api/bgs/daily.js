import { Duration, DateTime } from 'luxon'
import { fetchNightscoutData } from '../../../api'
import { authMiddleware } from '../../../api/middleware'

export default async (req, res) => {
    const user = await authMiddleware(req, res)
    const tz = req.query.tz
    if(!tz) {
        throw new Error(`Request must specify a timezone using tz`)
    }

    let { startTime, endTime } = req.query
    let range = [startTime, endTime].map(x => DateTime.fromJSDate(new Date(x)))

    const { treatments, sgvs } = await fetchNightscoutData(user, range)
    const datum = {
        from: range[0].toString(),
        to: range[1].toString(),
        treatments, 
        sgvs
    }

    res.status(200).json(datum)
}