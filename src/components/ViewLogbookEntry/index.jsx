import { CircularProgress } from "@chakra-ui/core";
import { DateTime } from "luxon";
import { useContext } from "react";
import { useQuery } from 'react-query';
import {
    useParams
} from "react-router-dom";
import { BGSContext, selectInDateRange } from "../../misc/contexts";
import { convertData } from "../../pages/helpers";
import { LogbookEntryContainer } from "../LogbookEntry/Container";
import { getDateRangeOfOneDay } from '../../misc/utils'

export const ViewLogbookEntry = function() {
    // The id is a timestamp, which we use to determine which day of logbook data to display.
    let { id } = useParams()
    const [ startTime, endTime ] = getDateRangeOfOneDay(parseInt(id))
    const { treatments, bgs, getBGData } = useContext(BGSContext)

    const { isLoading, isSuccess } = useQuery(
        ['logbook-entry-get-data', startTime, endTime], 
        () => getBGData(startTime, endTime)
    )

    return <>
        {isLoading && <>
            <span><CircularProgress isIndeterminate size="sm" color="green"/> Loading BG's from Nightscout...</span>
        </>}

        {isSuccess && <LogbookEntryContainer 
            dateRange={[startTime, endTime].map(x => new Date(x))}
            data={convertData(selectInDateRange(bgs, startTime, endTime))}
            treatments={selectInDateRange(treatments, startTime, endTime)}
        /> }
    </>
}