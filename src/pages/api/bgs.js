import { Duration, DateTime } from 'luxon'
import MongoClient from 'mongodb'
import { getMongoDatabase } from '../../api'
import { authMiddleware } from '../../api/middleware'

async function fetchNightscoutData(user, range) {
    const db = await getMongoDatabase(user.MONGO_DB_URL, user.MONGO_DB_NAME)

    // (1) Nightscout stores treatments with a created_at field encoded as a UTC date string.
    //     Ordering with $gte/$lte in queries is based on string comparison,
    //     and so we have to normalise the dates we use to query into the UTC+0 timezone.
    //     This contrasts with entries, which have the numeric Unix timestamp as a `date` field. Sigh.
    //  
    // (2) We use `created_at`, which is ALWAYS in the UTC timezone.
    //     The `timestamp` field has varying timezone, depending on implementation.
    //     In Loop, it is in the UTC timezone.
    //     In OpenAPS, it is in the user's local timezone.
    const treatmentTimeRange = range.map(v => {
        return v.setZone('utc').toISO()
    })

    const treatments = await db.collection('treatments')
        .find({
            created_at: {
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
        .project({
            date: 1,
            sgv: 1,
        })
        .toArray()
    
    return {
        treatments,
        data: sgvs,
    }
}

export default async (req, res) => {
    const user = authMiddleware(req, res)

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