import * as _ from 'lodash'
import queryString from 'query-string'
import React, { useState } from "react"
import { usePromiseLoadingState } from '../pages/helpers'
import { tz } from "./wrappers"

export const NightscoutProfilesContext = React.createContext()
export const BGSContext = React.createContext()

export const BGSModel = ({ children }) => {
    const [bgs, setBgs] = useState(null)
    const [profiles, setProfiles] = useState(null)
    const [getBGData, loadingBGData] = usePromiseLoadingState(getBGData_)

    async function getBGData_() {
        const params = {
            tz
        }
        const [ bgs, profiles ] = await Promise.all([
            fetch(`/api/bgs/daily?${queryString.stringify(params)}`).then(res => res.json()),
            fetch(`/api/profiles?${queryString.stringify(params)}`).then(res => res.json())
        ])
        setProfiles(_.sortBy(profiles, 'mills'))
        setBgs(bgs)
    }

    return <BGSContext.Provider value={{ getBGData, bgs, profiles, loadingBGData }}>
        <NightscoutProfilesContext.Provider value={profiles}>
            {children}
        </NightscoutProfilesContext.Provider>
    </BGSContext.Provider>
}

