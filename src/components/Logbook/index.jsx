import { Box, Heading, CircularProgress } from "@chakra-ui/core"
import { convertData, usePromiseLoadingState } from "../../pages/helpers"
import { useState, useEffect, useContext } from "react"
import queryString from 'query-string'
import { tz } from "../../misc/wrappers"
import { Icon, Text } from "@chakra-ui/core";
import { BGSContext, NightscoutProfilesContext } from "../../misc/contexts"
import * as _ from 'lodash'
import { LogbookEntryContainer } from "../LogbookEntry/Container"

export const Logbook = () => {
    const { bgs, getBGData, loadingBGData } = useContext(BGSContext)

    useEffect(() => {
        if(!bgs) {
            getBGData()
        }
    }, [])

    return <Box p={5} boxShadow="lg">
        <Text fontSize="xl" pb={5}>
            <b>Label and understand your patterns</b>. 
            Start by highlighting directly on your chart, and you can begin to add notes and build a richer understanding of your day.
        </Text>
        
        {loadingBGData && <>
            <span><CircularProgress isIndeterminate size="sm" color="green"/> Loading BG's from Nightscout...</span>
        </>}

        {bgs && bgs.map((bgset, i) => {
            return <div key={bgset.from}>
                <LogbookEntryContainer 
                    dateRange={[bgset.from, bgset.to].map(x => new Date(x))}
                    data={convertData(bgset.data)}
                    treatments={bgset.treatments}/>
            </div>
        })}
    </Box>
}