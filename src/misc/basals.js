/**
 * @typedef NSProfile
 * @property {string} defaultProfile The key in `store` for the default profile.
 * @property {string} enteredBy The system that recorded this profile. eg. Loop, OpenAPS
 * @property {string} mills 
 * @property {string} startDate
 * @property {string} units
 * @property {string} _id
 * @property {Object<string, NSProfileStore>} store
 */

/**
 * @typedef NSProfileStore
 * @property {Array<NSBasal>} basal List of basals.
 * @property {Array<NSCarbRatio>} carbratio List of carb ratios.
 * @property {Array<NSProfileInsulinSensitivity>} sens List of insulin sensitivities.
 * @property {Array<NSProfileBGTarget>} target_high
 * @property {Array<NSProfileBGTarget>} target_low
 * @property {string} timezone A timezone-ish string. eg. ETC/GMT-10, Australia/Brisbane.
 */

/**
 * @typedef NSBasal
 * @property {string | number} value The basal rate.
 * @property {string} time The time of basal start, as HH:MM.
 * @property {string | number} timeAsSeconds The time of basal start, as number of seconds from 00:00.
 */

/**
 * @typedef NSCarbRatio
 * @property {string | number} value The carb ratio.
 * @property {string} time The time of carb ratio start, as HH:MM.
 * @property {string | number} timeAsSeconds The time of carb ratio start, as number of seconds from 00:00.
 */

/**
 * @typedef NSProfileInsulinSensitivity
 * @property {string | number} value The insulin sensitivity.
 * @property {string} time The time of insulin sensitivity start, as HH:MM.
 * @property {string | number} timeAsSeconds The time of insulin sensitivity start, as number of seconds from 00:00.
 */

/**
 * @typedef NSProfileBGTarget
 * @property {string | number} value The BG target.
 * @property {string} time The time of BG target start, as HH:MM.
 * @property {string | number} timeAsSeconds The time of BG target start, as number of seconds from 00:00.
 */

/**
 * @typedef NSTempBasalTreatment
 * @property {"Temp Basal"} eventType
 * @property {Object} raw_rate 
 * @property {number} duration
 * @property {number} absolute
 * @property {number} rate
 * @property {string} created_at
 * @property {string} timestamp 
 * @property {string} enteredBy 
 * @property {number} utcOffset 
 * @property {Object | null} carbs 
 * @property {Object | null} insulin
 */


/**
 * @typedef {Array<BasalSeriesEntry>} BasalSeries
 */
/**
 * @typedef {Object} BasalSeriesEntry
 * @property {number} rate
 * @property {number} startTime
 */

import _ from 'lodash'
import { DateTime } from 'luxon'
import { MINUTE } from '../model'

/**
 * Computes the complete basal series from a series of 
 * temp basal treatments, and a list of profiles.
 * @param {Array<NSProfile>} profiles 
 * @param {Array<NSTempBasalTreatment>} treatments 
 * @returns {BasalSeries}
 */
export function getBasalSeries(profiles, treatments, fromDate, toDate) {
    /** @type {BasalSeries} */
    let basalSeries = []

    treatments = treatments.map(treatment => {
        return { ...treatment, time: +new Date(treatment.timestamp) }
    })
    
    let event
    let basals = []

    let activeBasal = null
    let lastTreatment = null

    // Convert date to relative seconds after midnight.
    const startOfDayMs = DateTime.fromMillis(fromDate).startOf('day').toMillis()

    for(let i = fromDate; i <= toDate; i += 5 * MINUTE) {
        if(lastTreatment) {
            const expiresAt = lastTreatment.time + lastTreatment.duration*MINUTE
            if(i > expiresAt) {
                activeBasal = null // expired
                lastTreatment = null
            }
        }
        
        if(!activeBasal) {
            const currentProfile = getCurrentProfile(profiles, i)

            if(currentProfile) {
                let profileBasal = getActiveBasal(
                    currentProfile.store[currentProfile.defaultProfile].basal,
                    (i - startOfDayMs) / 1000
                )

                activeBasal = {
                    rate: profileBasal.rate,
                    startTime: i
                }
                lastTreatment = {
                    duration: 5,
                    time: i
                }
            } else {
                console.debug("No currentProfile. Perhaps the user is missing data.")
            }
        }
        
        // Find all treatments within this 5 minute range, apply the most recent.
        let latestTreatment = _.find(treatments, el => el.time >= i && el.time <= i + 5*MINUTE)
        
        if(latestTreatment) {
            lastTreatment = latestTreatment
            activeBasal = {
                rate: latestTreatment.rate,
                startTime: latestTreatment.time
            }
        }
        
        // TODO: activeBasal may be null due to missing profile data. This should be fixed,
        // but I haven't devised a good solution yet.
        if(activeBasal) {
            basalSeries.push(activeBasal)
        }
    }

    return basalSeries
}

/** 
 * @param {Array<NSProfile>} profiles Ordered list of profiles
 */
export function getCurrentProfile(profiles, time) {
    return _.find(profiles, profile => profile.mills <= time)
}

/**
 * @param {NSProfile} profile 
 * @param {number} fromTimeAsSeconds A millisecond datetime.
 * @param {number} toDate A millisecond datetime.
 */
export function getActiveBasal(profileBasals, fromTimeAsSeconds) {
    const basal = _.find(profileBasals, basal => basal.timeAsSeconds <= fromTimeAsSeconds)
    if(!basal) debugger
    return { 
        rate: basal.value 
    }
}