import { Box, Heading, CircularProgress } from "@chakra-ui/core"
import { convertData, usePromiseLoadingState } from "../../pages/helpers"
import { useState, useEffect } from "react"
import queryString from 'query-string'
import { tz } from "../../misc/wrappers"
import { Icon, Text } from "@chakra-ui/core";
import { NightscoutProfilesContext } from "../../misc/contexts"
import * as _ from 'lodash'
import { LogbookEntryContainer } from "../LogbookEntry/Container"

export const Logbook = () => {
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

    useEffect(() => {
        getBGData()
    }, [])

    return <Box p={5} boxShadow="lg">
        <Text fontSize="xl" pb={5}>
            <b>Label and understand your patterns</b>. 
            Start by highlighting directly on your chart, and you can begin to add notes and build a richer understanding of your day.
        </Text>
        
        {loadingBGData && <>
            <span><CircularProgress isIndeterminate size="sm" color="green"/> Loading BG's from Nightscout...</span>
        </>}

        <NightscoutProfilesContext.Provider value={profiles}>
            {bgs && bgs.map((bgset, i) => {
                return <div key={bgset.from}>
                    <LogbookEntryContainer 
                        dateRange={[bgset.from, bgset.to].map(x => new Date(x))}
                        data={convertData(bgset.data)}
                        treatments={bgset.treatments}/>
                </div>
            })}
        </NightscoutProfilesContext.Provider>
    </Box>
}