const BETA_USERS = require('./beta_users.json')

export function authMiddleware(req, res) {
    const diabetacode = req.cookies['diabetacode']
    if(!diabetacode) {
        throw new Error("diabetacode was not supplied as cookie, authentication failed.")
    }
    const user = BETA_USERS[diabetacode]
    if(!user) {
        throw new Error(`No user found for code: "${diabetacode}"`)
    }
    return user 
}