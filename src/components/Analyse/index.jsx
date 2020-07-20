import { Box, Heading, CircularProgress } from "@chakra-ui/core"
import { convertData } from "../../pages/helpers"
import { AnnotatorContainer } from "../Annotator/Container"

export const Analyse = ({ loadingBGData, bgs }) => {
    return <Box p={5} boxShadow="lg">
        <Heading size="xl" pb={5}>Past 2 weeks.</Heading>
        
        {loadingBGData && <>
            <span><CircularProgress isIndeterminate size="sm" color="green"/> Loading BG's...</span>
        </>}
        
        {bgs && bgs.map((bgset, i) => {
            return <div key={i}>
                <AnnotatorContainer data={convertData(bgset.data)}/>
            </div>
        })}
    </Box>
}