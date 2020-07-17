import { Duration, DateTime } from 'luxon'


export default async (req, res) => {
    const DAYS_TO_RETRIEVE = 7*5 // 5 weeks
    let today = DateTime.local()
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

    const url = `${process.env.NEXT_PUBLIC_NIGHTSCOUT_ENDPOINT_URL}/api/v1/entries/sgv.json?find[date][$gte]=${range[0].toMillis()}&find[date][$lte]=${range[1].toMillis()}&count=10000000`
    console.log(url)
    let data = await fetch(url)
        .then(response => response.json())

    // // Run an algo on this data.
    // let total = 0

    // for(let datum of data) {
    //     total += datum.sgv
    // }
    // console.log(total)

    res.status(200).json(data)
}