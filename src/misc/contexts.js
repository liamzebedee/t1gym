import * as _ from 'lodash'
import { DateTime } from 'luxon'
import queryString from 'query-string'
import React, { useState } from "react"
import { tz } from "./wrappers"

export const NightscoutProfilesContext = React.createContext()
export const BGSContext = React.createContext()

export function selectInDateRange(data, start, end) {
    return data.filter(x => x.date <= end && x.date >= start)
}

export function selectTreatmentsInDateRange(data, start, end) {
    return data.filter(x => x.date <= end && x.date >= start)
}

export const BGSModel = ({ children }) => {
    const [bgs, setBgs] = useState([])
    const [treatments, setTreatments] = useState([])
    const [profiles, setProfiles] = useState(null)

    async function getBGData(startTime, endTime) {
        const params = {
            tz,
            startTime: DateTime.fromMillis(startTime).toString(),
            endTime: DateTime.fromMillis(endTime).toString()
        }
        const [ data, profiles ] = await Promise.all([
            fetch(`/api/bgs/daily?${queryString.stringify(params)}`).then(res => res.json()),
            fetch(`/api/profiles?${queryString.stringify(params)}`).then(res => res.json())
        ])

        // Now split data stream into day-based buckets.
        setProfiles(_.sortBy(profiles, 'mills'))
        setBgs([
            ...bgs,
            ...data.sgvs
        ])
        setTreatments([
            ...treatments,
            ...data.treatments.map(treatment => {
                treatment.date = +(new Date(treatment.timestamp))
                return treatment
            })
        ])
    }

    return <BGSContext.Provider value={{ getBGData, bgs, treatments, profiles }}>
        <NightscoutProfilesContext.Provider value={profiles}>
            {children}
        </NightscoutProfilesContext.Provider>
    </BGSContext.Provider>
}

