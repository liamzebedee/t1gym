import { Duration, DateTime } from 'luxon'

export default async (req, res) => {
    let { startTime, endTime } = req.query
    let range = [startTime, endTime].map(x => DateTime.fromJSDate(new Date(x)))

    const url = `${process.env.NEXT_PUBLIC_NIGHTSCOUT_ENDPOINT_URL}/api/v1/entries/sgv.json?find[date][$gte]=${range[0].toMillis()}&find[date][$lte]=${range[1].toMillis()}&count=1000`
    let data = await fetch(url)
        .then(response => response.json())
    console.log(url)
    const datums = {
        from: range[0].toString(),
        to: range[1].toString(),
        data
    }

    res.status(200).json(datums)
}