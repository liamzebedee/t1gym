import { Duration, DateTime } from 'luxon'



import MongoClient from 'mongodb'
const MONGO_DB_URL = process.env.MONGO_DB_URL
const MONGO_DB_NAME = process.env.MONGO_DB_NAME

if(!MONGO_DB_URL) {
    throw new Error("MONGO_DB_URL is undefined. Cannot connect to Nightscout.")
}
if(!MONGO_DB_NAME) {
    throw new Error("MONGO_DB_NAME is undefined. Cannot connect to Nightscout.")
}

async function fetchNightscoutData(range) {
    const client = await MongoClient.connect(MONGO_DB_URL)
    const db = client.db(MONGO_DB_NAME)

    // Nightscout stores treatments with a timestamp field encoded as a UTC date string.
    // Ordering with $gte/$lte in queries is based on string comparison,
    // and so we have to normalise the dates we use to query into the UTC+0 timezone.
    // This contrasts with entries, which have the numeric Unix timestamp as a `date` field.
    // Sigh.
    const treatmentTimeRange = range.map(v => {
        return v.setZone('utc').toISO()
    })

    const treatments = await db.collection('treatments')
        .find({
            timestamp: {
                $gte: treatmentTimeRange[0],
                $lte: treatmentTimeRange[1],
            }
        })
        .toArray()
    
    const sgvs = await db.collection('entries')
        .find({
            date: {
                $gte: range[0].toMillis(),
                $lte: range[1].toMillis(),
            }
        })
        .toArray()
    
    return {
        treatments,
        data: sgvs,
    }
}

// async function fetchTreatments(range) {
//     const client = await MongoClient.connect(MONGO_DB_URL)
//     const db = client.db('heroku_hfwzth9r')
//     const treatments = await db.collection('treatments')
//         .find({
//             timestamp: {
//                 $gte: range[0].toISO(),
//                 $lte: range[1].toISO(),
//             }
//         })
//         .toArray()
//     return treatments
// }

// async function fetchSgvs(range) {
//     const client = await MongoClient.connect(MONGO_DB_URL)
//     const db = client.db('heroku_hfwzth9r')
//     const treatments = await db.collection('entries')
//         .find({
//             date: {
//                 $gte: range[0].toMillis(),
//                 $lte: range[1].toMillis(),
//             }
//         })
//         .toArray()
//     return treatments
// } 

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
    
    const datums = ranges.map(async range => {
        // const treatments = await fetchTreatments(range)
        // const data = await fetchSgvs(range)
        // console.log(data)
        // const url = `${process.env.NEXT_PUBLIC_NIGHTSCOUT_ENDPOINT_URL}/api/v1/entries/sgv.json?find[date][$gte]=${range[0].toMillis()}&find[date][$lte]=${range[1].toMillis()}&count=1000`
        // let data = await fetch(url)
        //     .then(response => response.json())
        // console.log(url)

        return {
            from: range[0].toString(),
            to: range[1].toString(),
            ...await fetchNightscoutData(range)
            // data,
            // treatments
        }
    })

    res.status(200).json(
        await Promise.all(datums)
    )   
}