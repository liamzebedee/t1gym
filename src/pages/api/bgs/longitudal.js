import { Duration, DateTime } from 'luxon'
import { fetchSgvs } from '../../../api'
import { authMiddleware } from '../../../api/middleware'

export default async (req, res) => {
    const user = await authMiddleware(req, res)
    const tz = req.query.tz
    if(!tz) {
        throw new Error(`Request must specify a timezone using tz`)
    }
    
    const { fromDate, toDate } = req.query
    const range = [fromDate, toDate].map(x => DateTime.fromMillis(parseInt(x)))
    const data = await fetchSgvs(user, range)

    res.status(200).json(data)
}