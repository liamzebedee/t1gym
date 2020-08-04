import MongoClient from 'mongodb'

export async function getMongoDatabase(mongoDbUrl, mongoDbName) {
    const client = await MongoClient.connect(mongoDbUrl)
    const db = client.db(mongoDbName)
    return db
}

export async function fetchTreatments(user, range) {
    const db = await getMongoDatabase(user.MONGO_DB_URL, user.MONGO_DB_NAME)
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

export async function fetchSgvs(user, range) {
    const db = await getMongoDatabase(user.MONGO_DB_URL, user.MONGO_DB_NAME)
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