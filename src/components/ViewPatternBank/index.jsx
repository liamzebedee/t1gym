import { Button, CircularProgress } from "@chakra-ui/core";
import { DateTime } from "luxon";
import { useContext, useState } from "react";
import { useQuery } from 'react-query';
import {
    useParams
} from "react-router-dom";
import { BGSContext, selectInDateRange } from "../../misc/contexts";
import { convertData } from "../../pages/helpers";
import { LogbookEntryContainer } from "../LogbookEntry/Container";
import { Select } from "@chakra-ui/core"
import { annotationRepository } from "../../misc/annotation_repository";

import { Link } from 'react-router-dom'
import { Promise } from 'bluebird'

const PATTERNS = ['Exercise', 'Sleep-in', 'Pizza']

export const ViewPatternBank = function() {
    const { treatments, bgs, getBGData } = useContext(BGSContext)
    const [ selectedTag, setSelectedTag ] = useState(null)

    const { isLoading, isSuccess, data } = useQuery(
        ['pattern-bank-get-data', selectedTag], 
        () => findPatterns(selectedTag)
    )


    async function findPatterns(tag) { 
        if(tag == null) {
            return {
                days: []
            }
        }

        const annotations = await annotationRepository.findAnnotationsWithTags([ tag ])

        // Get the days for all annotations.
        let days = []
        for(let annotation of annotations) {
            days.push(DateTime.fromJSDate(annotation.startTime))
        }

        // await Promise.map(days, day => {
        //     const startTime = day.toMillis()
        //     const endTime = day.plus({ days: 1 }).toMillis()
        //     return getBGData(startTime, endTime)
        // })

        return {
            days,
        }
    }

    
    async function selectPattern(event) {
        const tag = event.target.value
        if(tag === "") return
        setSelectedTag(tag)
    }

    return <>
        <Select placeholder="Select option" onChange={selectPattern}>
            {PATTERNS.map(pattern => {
                return <option key={pattern} value={pattern}>{pattern}</option>
            })}
        </Select>
        
        {isLoading && <>
            <span><CircularProgress isIndeterminate size="sm" color="green"/> Loading BG's from Nightscout...</span>
        </>}

        <ul>
        {isSuccess && data.days.map((day, i) => {
            const time = day.toMillis()
            return <li>
                <Link key={time} to={`/logbook/entry/${day.toMillis()}`}>{day.toFormat('ccc DDD')}</Link>
            </li>
        })}
        </ul>

        {/* {isSuccess && data.days.map((day, i) => {
            const from = day.toMillis()
            const to = day.plus({ days: 1 }).toMillis()

            return <div key={day}>
                <LogbookEntryContainer 
                    dateRange={[from, to].map(x => new Date(x))}
                    data={convertData(selectInDateRange(bgs, from, to))}
                    treatments={selectInDateRange(treatments, from, to)}
                    />
            </div>
        })} */}
    </>
}