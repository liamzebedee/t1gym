import { Duration, DateTime } from 'luxon'
import { fetchSgvs } from '../../../api'
import { getInviteCodeDetails } from '../../../api/middleware'

import { admin } from '../../../api/firebase'

export default async (req, res) => {
    try {
        const inviteDetails = await getInviteCodeDetails(req, res)
        const uid = inviteDetails.code
        const customToken = await admin.auth().createCustomToken(uid)

        res.status(200).json({ token: customToken })
    } catch(error) {
        res.status(401).json({
            error: error.toString()
        })
        throw new Error(`Error creating custom token: ${error}`);
    }
}