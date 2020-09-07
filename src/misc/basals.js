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

/**
 * Computes the complete basal series from a series of 
 * temp basal treatments, and a list of profiles.
 * @param {Array<NSProfile>} profiles 
 * @param {Array<NSTempBasalTreatment>} treatments 
 * @returns {BasalSeries}
 */
export function getBasalSeries(profiles, treatments, fromDate, fromTime, toTime) {
    /** @type {BasalSeries} */
    let basalSeries = []

    // Normalise into timeline of profile changes and treatment events.
    let timeline = []
    let profilesPaired = getPairs(
        profiles.filter((profile) => profile.mills >= fromDate)
    )
    timeline.concat(
        profilesPaired.map(pair => {
            return {
                fromTime: parseInt(pair[0].mills),
                toTime: parseInt(pair[1].mills),
                profile: pair[0]
            }
        })
    )
    timeline.concat(
        getPairs(treatments).map(pair => {
            return {
                fromTime: +new Date(pair[0].created_at),
                toTime: +new Date(pair[1].created_at),
                treatment: pair[0]
            }
        })
    )

    let currentTime
    let currentProfile

    timeline = _.sortBy(timeline, 'fromTime')

    
    let event
    let basals = []

    while(timeline.length) {
        event = timeline.shift()
        basals = []
        
        // Update profile.
        if(event.profile) {
            currentProfile = event.profile
            // basalSeries.push(
            //     getActiveBasals(currentProfile, currentTime, event.toTime)
            // )
            currentTime = event.fromTime
            continue
        }

        // Push default basal.
        basals.push(
            getActiveBasals(currentProfile, currentTime, event.toTime)
        )

        if(event.treatment) {
            const { rate, } = event.treatment
            basals.push({
                rate,
                startTime
            })
        }
        
        basalSeries.push(basals)
        currentTime = event.fromTime
    }

    return basalSeries
}

/**
 * @param {NSProfile} profile 
 * @param {number} fromDate A millisecond datetime.
 * @param {number} toDate A millisecond datetime.
 */
export function getActiveBasals(profile, fromDate, toDate) {
    if(fromDate >= toDate) return []

    // Convert date to relative seconds after midnight.
    const fromDateDT = DateTime.fromMillis(fromDate)
    const fromTimeAsSeconds = fromDateDT
        .set({
            year: 0,
            month: 0,
            day: 0,
            millisecond: 0,
        })
        .toSeconds()
    
    const profileStore = profile.store[profile.defaultProfile]
    const basals = profileStore.basal
        .filter(basal => basal.timeAsSeconds >= fromTimeAsSeconds)

    const basal = basals[0]
    const activeBasal = {
        rate: basal.rate,
        startTime: fromDate + (basals[0].timeAsSeconds * 1000)
    }
    
    return [
        activeBasal,
        ...getActiveBasals(profile, fromDate + (basals[0].timeAsSeconds * 1000), toDate)
    ]
}

export function getPairs(list) {
    let pairs = []
    for(let i = 0; i < list.length; i++) {
        if((i + 1) == list.length) {
            pairs.push([ list[0], list[i] ])
        } else {
            pairs.push([ list[i], list[i + 1] ])
        }
    }
}

