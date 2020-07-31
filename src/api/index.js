import MongoClient from 'mongodb'

const MONGO_DB_URL = process.env.MONGO_DB_URL
const MONGO_DB_NAME = process.env.MONGO_DB_NAME

if(!MONGO_DB_URL) {
    throw new Error("MONGO_DB_URL is undefined. Cannot connect to Nightscout.")
}

if(!MONGO_DB_NAME) {
    throw new Error("MONGO_DB_NAME is undefined. Cannot connect to Nightscout.")
}

export async function getMongoDatabase() {
    const client = await MongoClient.connect(MONGO_DB_URL)
    const db = client.db(MONGO_DB_NAME)
    return db
}

export async function fetchTreatments(range) {
    const db = await getMongoDatabase()
    const entries = await db.collection('treatments')
        .find({
            timestamp: {
                $gte: range[0].toISO(),
                $lte: range[1].toISO(),
            }
        })
        .toArray()
    return entries
}

export async function fetchSgvs(range) {
    const db = await getMongoDatabase()
    const entries = await db.collection('entries')
        .find({
            type: {
                $eq: 'sgv',
            },
            date: {
                $gte: range[0].toMillis(),
                $lte: range[1].toMillis(),
            }
        })
        .project({
            date: 1,
            sgv: 1,
            _id: 0,
        })
        .limit(100000)
        .toArray()
    return entries
}