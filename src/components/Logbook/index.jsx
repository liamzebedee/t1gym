import { Box, Heading, CircularProgress } from "@chakra-ui/core"
import { convertData, usePromiseLoadingState } from "../../pages/helpers"
import { useState, useEffect, useContext } from "react"
import queryString from 'query-string'
import { tz } from "../../misc/wrappers"
import { Icon, Text } from "@chakra-ui/core";
import { BGSContext, NightscoutProfilesContext, selectInDateRange } from "../../misc/contexts"
import * as _ from 'lodash'
import { LogbookEntryContainer } from "../LogbookEntry/Container"
import { DateTime } from "luxon"
import { useRunOnce } from "../../misc/hooks"
import { useQuery, QueryCache, ReactQueryCacheProvider } from 'react-query'

export const Logbook = function() {
    const { bgs, treatments, getBGData, loadingBGData } = useContext(BGSContext)

    const DAYS_TO_RETRIEVE = 21
    const today = DateTime.local().set({
        hour: 0,
        minute: 0,
        millisecond: 0,
        second: 0
    })
    const startTime = today.minus({ days: DAYS_TO_RETRIEVE }).toMillis()
    const endTime = today.plus({ days: 1 }).toMillis()

    const query = useQuery(
        `logbook-get-data`,
        () => getBGData(startTime, endTime)
    )
    
    const { isLoading, isSuccess } = query

    let date = today.minus({ days: DAYS_TO_RETRIEVE })
    let days = []
    for(let i = 0; i < DAYS_TO_RETRIEVE; i++) {
        date = date.plus({ days: 1 })
        days.push(date)
    }
    days = days.reverse()

    return <Box p={5} boxShadow="lg">
        <Text fontSize="xl" pb={5}>
            <b>Label and understand your patterns</b>. 
            Start by highlighting directly on your chart, and you can begin to add notes and build a richer understanding of your day.
        </Text>
        
        {isLoading && <>
            <span><CircularProgress isIndeterminate size="sm" color="green"/> Loading BG's from Nightscout...</span>
        </>}

        {isSuccess && days.map((day, i) => {
            const from = day.toMillis()
            const to = day.plus({ days: 1 }).toMillis()

            return <div key={day}>
                <LogbookEntryContainer 
                    dateRange={[from, to].map(x => new Date(x))}
                    data={convertData(selectInDateRange(bgs, from, to))}
                    treatments={selectInDateRange(treatments, from, to)}
                    />
            </div>
        })}
    </Box>
}