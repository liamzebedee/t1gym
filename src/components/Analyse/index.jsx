import { Box, Heading, CircularProgress } from "@chakra-ui/core"
import { convertData, usePromiseLoadingState } from "../../pages/helpers"
import { AnnotatorContainer } from "../Annotator/Container"
import { useState, useEffect } from "react"
import queryString from 'query-string'
import { tz } from "../../misc/wrappers"

export const Analyse = () => {
    const [bgs, setBgs] = useState(null)
    const [getBGData, loadingBGData] = usePromiseLoadingState(getBGData_)

    async function getBGData_() {
        const params = {
            tz
        }
        const data = await fetch(`/api/bgs/daily?${queryString.stringify(params)}`).then(res => res.json())
        setBgs(data)
    }

    useEffect(() => {
        getBGData()
    }, [])

    return <Box p={5} boxShadow="lg">
        <Heading size="xl" pb={5}>Past 2 weeks.</Heading>
        
        {loadingBGData && <>
            <span><CircularProgress isIndeterminate size="sm" color="green"/> Loading BG's from Nightscout...</span>
        </>}
        
        {bgs && bgs.map((bgset, i) => {
            return <div key={i}>
                <AnnotatorContainer 
                    data={convertData(bgset.data)}
                    treatments={bgset.treatments}/>
            </div>
        })}
    </Box>
}