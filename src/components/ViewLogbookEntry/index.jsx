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

export const ViewLogbookEntry = function() {
    let { id } = useParams()
    const startTime = parseInt(id)
    const endTime = DateTime.fromMillis(startTime).plus({ days: 1 }).toMillis()

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