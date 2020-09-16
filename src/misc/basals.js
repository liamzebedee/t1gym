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
 * @property {boolean} isProfileBasal
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
                let profileBasal = getActiveBasals(
                    currentProfile.store[currentProfile.defaultProfile].basal,
                    i, i + 5*MINUTE
                ).pop()
    
                activeBasal = {
                    rate: profileBasal.rate,
                    profileRate: {
                        rate: profileBasal.rate,
                        isActive: true
                    },
                    startTime: i,
                }
                lastTreatment = {
                    duration: 5,
                    time: i
                }
            }
        }
        
        // Find all treatments within this 5 minute range, apply the most recent.
        let latestTreatment = treatments
            .filter(el => el.time >= i && el.time <= i + 5*MINUTE).pop()
        
        if(latestTreatment) {
            lastTreatment = latestTreatment

            const currentProfile = getCurrentProfile(profiles, i)
            let profileBasal = getActiveBasals(
                currentProfile.store[currentProfile.defaultProfile].basal,
                i, i + 5*MINUTE
            ).pop()

            activeBasal = {
                rate: latestTreatment.rate,
                startTime: latestTreatment.time,
                profileRate: {
                    rate: profileBasal.rate,
                    isActive: false
                },
            }
        }
        
        basalSeries = [
            ...basalSeries,
            Object.assign({}, activeBasal)
        ]
    }

    return basalSeries
}

/** 
 * @param {Array<NSProfile>} profiles 
 */
export function getCurrentProfile(profiles, time) {
    return _.sortBy(
        profiles.filter(profile => profile.mills <= time), ['mills']
    ).pop()
}

/**
 * @param {NSProfile} profile 
 * @param {number} fromDate A millisecond datetime.
 * @param {number} toDate A millisecond datetime.
 */
export function getActiveBasals(profileBasals, fromDate, toDate) {
    if(fromDate >= toDate) return []

    // Convert date to relative seconds after midnight.
    const fromDateDT = DateTime.fromMillis(fromDate)
    const fromTimeAsSeconds = fromDateDT.diff(fromDateDT.plus({ day: 1 }).startOf('day'), 'second').seconds * -1
    
    const basals = profileBasals
        .filter(basal => basal.timeAsSeconds <= fromTimeAsSeconds)
    if(!basals.length) debugger
    const basal = basals.pop()
    const activeBasal = {
        rate: basal.value,
        startTime: fromDate + (basal.timeAsSeconds * 1000)
    }
    return [activeBasal]
}