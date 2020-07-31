import { Duration, DateTime } from 'luxon'
import { fetchSgvs } from '../../api'

export default async (req, res) => {
    let { startTime, endTime } = req.query
    let range = [startTime, endTime].map(x => DateTime.fromJSDate(new Date(x)))
    
    const data = await fetchSgvs(range)
    const datums = {
        from: range[0].toString(),
        to: range[1].toString(),
        data
    }

    res.status(200).json(datums)
}