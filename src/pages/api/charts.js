import { Duration, DateTime } from 'luxon'
import { fetchSgvs } from '../../api'
import { authMiddleware } from '../../api/middleware'

export default async (req, res) => {
    const user = await authMiddleware(req, res)

    let { startTime, endTime } = req.query
    let range = [startTime, endTime].map(x => DateTime.fromJSDate(new Date(x)))
    
    const data = await fetchSgvs(user, range)
    const datums = {
        from: range[0].toString(),
        to: range[1].toString(),
        data
    }

    res.status(200).json(datums)
}