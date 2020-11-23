import MongoClient from 'mongodb'

import { admin } from '../api/firebase'

class MongoDBConnectionCache {
    cache = {}

    async getMongoDatabase(userId) {
        let db = this.cache[userId]
        if(db) return db
        else {
            db = await this.getNewMongoDatabase(userId)
            this.cache[userId] = db
            return db
        }
    }

    async getNewMongoDatabase(userId) {
        const userRecord = await admin.database().ref(`/users/${userId}`).once('value').then(snapshot => snapshot.val())
        const client = await MongoClient.connect(userRecord.mongoDbUrl)
        const db = client.db(userRecord.mongoDbName)
        return db
    }
}

let mongoDBConnectionCache = new MongoDBConnectionCache()

export async function getMongoDatabase(userId) {
    return mongoDBConnectionCache.getMongoDatabase(userId)
}

export async function fetchTreatments(user, range) {
    const db = await getMongoDatabase(user)
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
    const db = await getMongoDatabase(user)
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

export async function fetchNightscoutData(user, range) {
    const db = await getMongoDatabase(user)

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
            _id: 0,
        })
        .toArray()
    
    return {
        treatments,
        sgvs,
    }
}

export async function getProfiles(user, range) {
    const db = await getMongoDatabase(user)

    const treatmentTimeRange = range.map(v => {
        return v.setZone('utc').toISO()
    })

    const profiles = await db.collection('profile')
        .find({
            startDate: {
                $gte: treatmentTimeRange[0],
                $lte: treatmentTimeRange[1],
            }
        })
        .toArray()
    
    return profiles
}