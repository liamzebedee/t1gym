import { Duration, DateTime } from 'luxon'

export default async (req, res) => {

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
        // return [prev,curr]
        ranges.push([prev,curr])
        return curr
    })

    ranges = ranges.reverse()

    // ranges.map(range => {
    //     console.log(range[0].toString(), range[1].toString())
    // })
    
    const datums = ranges.map(async range => {
        const url = `${process.env.NEXT_PUBLIC_NIGHTSCOUT_ENDPOINT_URL}/api/v1/entries/sgv.json?find[date][$gte]=${range[0].toMillis()}&find[date][$lte]=${range[1].toMillis()}&count=1000`
        let data = await fetch(url)
            .then(response => response.json())
        console.log(url)
        return {
            from: range[0].toString(),
            to: range[1].toString(),
            data
        }
    })

    res.status(200).json(
        await Promise.all(datums)
    )   
}