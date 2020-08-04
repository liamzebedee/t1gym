import { admin } from './firebase'

export async function getInviteCodeDetails(req, res) {
    const code = req.query['code']
    if(!code) {
        throw new Error("The `code` cookie was not supplied, authentication failed.")
    }

    const invite = await admin.database().ref(`/invites/${code}`).once('value').then(snapshot => snapshot.val())
    
    if(!invite) {
        throw new Error(`No invite found for code: "${code}"`)
    }
    return invite
}

export async function authMiddleware(req, res) {
    const token = req.cookies['token']
    if(!token) {
        throw new Error("token was not supplied as cookie, authentication failed.")
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token)
        let uid = decodedToken.uid
        return uid
    } catch(err) {
        throw new Error(`Error verifying Firebase auth token: ${err}`)
    }
    
    return user 
}