import { Box, Heading } from "@chakra-ui/core"
import { ReportCard } from "../ReportCard"

export const ViewOverview = () => {
    return <Box p={5} boxShadow="lg">
        <Heading size="xl">
            How am I tracking?
        </Heading>

        <Box pt={5}>
            <ReportCard />
        </Box>
    </Box>
}