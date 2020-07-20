import { useState, useEffect } from "react"
import DatabaseService from '../../misc/db_service'
import { Chart } from "../Chart"
import { CircularProgress, TagLabel, Tag, Stack, Flex, Box, Heading } from "@chakra-ui/core"
import queryString from 'query-string'
import { getStartOfDayForTime } from "../../pages/helpers"
import { convertData } from "../../pages/helpers"

const DEFAULT_TAGS = [
    'Exercise',
    'Drinking',
    'Missed bolus',
    'Lows',
    'Breakfast',
    'Question',
]

export const Scenarios = () => {
    let db
    let [annotations, setAnnotations] = useState(null)
    let [tags, setTags] = useState([])
    
    async function getScenarios() {
        db = await DatabaseService.get()
        const annotationRecords = await db.annotations
            .where('tags').anyOf('123')
            .distinct()
            .toArray()
        
        console.log(annotationRecords)
        setAnnotations(annotationRecords)
    }

    async function loadTagCounts(tag) {
        db = await DatabaseService.get()
        const count = await db.annotations.where('tags').anyOf(tag).count()
        return { tag, count }
    }

    async function loadTags() {
        db = await DatabaseService.get()
        setTags(await Promise.all(DEFAULT_TAGS.map(loadTagCounts)))
    }

    useEffect(() => {
        getScenarios()
        loadTags()
    }, [])

    const [tagFilter, setTagFilter] = useState(null)
    function selectTag(tag) {
        setTagFilter(tag)
        searchScenarios(tag)
    }

    const [results, setResults] = useState(null)
    const [loadingSearchResults, setLoadingSearchResults] = useState(null)

    async function searchScenarios(tag) {
        setLoadingSearchResults(true)

        // Get annotations for tag.
        db = await DatabaseService.get()
        const annotations = await db.annotations
            .where('tags').startsWithAnyOfIgnoreCase(tag)
            .distinct()
            .toArray()

        // Get charts for each annotation (from Nightscout).
        const datums = await Promise.all(annotations.map(async annotation => {
            const { startTime, endTime } = annotation
            const params = {
                startTime: startTime.toString(),
                endTime: endTime.toString()
            }
            const res = await fetch(`/api/charts?${queryString.stringify(params)}`).then(res => res.json())
            return {
                annotation,
                data: res.data
            }
        }))
        
        setResults(datums)
        setLoadingSearchResults(false)
    }

    return <Box p={5} boxShadow="lg">
        <Stack spacing={4} isInline>
            {tags.map(({ tag, count }, i) => {
                return <Tag key={i} onClick={() => selectTag(tag)} variantColor="gray">
                    <TagLabel>{tag} ({count})</TagLabel>
                </Tag>
            }) }
        </Stack>
        
        { loadingSearchResults && <p><CircularProgress isIndeterminate size="sm" color="green"/> Searching for {tagFilter}...</p> }
        
        { loadingSearchResults === false && <>
            {_.sortBy(results, ['annotation.startTime']).reverse().map((result, i) => {
                const day = getStartOfDayForTime(result.annotation.startTime)

                return <Box key={i} p={5}>
                    <Flex>
                        <Flex align="left">
                            <Stack alignItems='center'>
                                <Chart data={convertData(result.data)} 
                                    dynamicExtent={true}/>
                            </Stack>
                        </Flex>

                    <Flex flexGrow={1} align="right" flexDirection="column" align="top">
                        <Stack spacing={8}>
                            <Box p={5} shadow="sm" borderWidth="1px">
                                <Heading fontSize="xl">
                                    {day.toFormat('DDD')}
                                </Heading>
                                
                                Notes: <p style={{ whiteSpace: 'pre-wrap' }}>{result.annotation.notes}</p>
                            </Box>
                        </Stack>
                    </Flex>
                    </Flex>
                </Box>
            })}
        </>}
    </Box>
}