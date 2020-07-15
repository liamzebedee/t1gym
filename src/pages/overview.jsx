// https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4543190/#!po=21.4286
import { convertData, formatPlotlyDate } from './experiment'
import * as d3 from "d3";
import { useEffect, useRef, useState } from 'react';


import { ThemeProvider, CSSReset, TabList, Tabs, TabPanels, Tab, TabPanel, Box, Stack, Tag, TagLabel, Heading, CircularProgress } from "@chakra-ui/core";
import { useReducer } from "react";
import { useLayoutEffect } from "react";
import { Chart } from "../components/Chart";

import { Annotator } from '../components/Annotator'
import * as luxon from 'luxon'
import { Duration, DateTime } from 'luxon'



import DatabaseService from '../misc/db_service'

const Dashboard = () => {
    const [bgs, setBgs] = useState(null)
    const [getBGData, loadingBGData] = usePromiseLoadingState(getBGData_)

    async function getBGData_() {
        const data = await fetch('/api/bgs').then(res => res.json())
        setBgs(data)
    }

    useEffect(() => {
        DatabaseService.connect()
        getBGData()
    }, [])

    return <Box p="5">
        <Heading pt="5" pb="5">Type One Gym</Heading>
        <Tabs variant="soft-rounded" variantColor="green">
            <TabList>
                <Tab>Trainer</Tab>
                <Tab>Annotator</Tab>
                <Tab>Scenarios</Tab>
            </TabList>

            <TabPanels>

                <TabPanel>
                    <Box p={5} boxShadow="sm">
                    <Heading size="lg">
                        How am I tracking?
                    </Heading>

                    <Box p={5}>
                        <ReportCard/>
                    </Box>

                    {/* Breakfast

                    Lunch

                    Dinner

                    Overnight */}
                    </Box>
                </TabPanel>

                <TabPanel>
                    <Box p={5} boxShadow="lg">
                        <Heading size="lg">Past 2 weeks.</Heading>
                        
                        {loadingBGData && <>
                            <CircularProgress isIndeterminate size="sm" color="green"/>
                            <span>Loading BG's...</span>
                        </>}
                        
                        {bgs && bgs.map((bgset, i) => {
                            return <div key={i}>
                                <AnnotatorContainer data={convertData(bgset.data)}/>
                            </div>
                        })}
                    </Box>
                </TabPanel>

                <TabPanel>
                    <Scenarios/>
                </TabPanel>
            </TabPanels>
        </Tabs>

        
    </Box>
}

const DEFAULT_TAGS = [
    'Exercise',
    'Drinking',
    'Question',
]



import { getStartOfDayForTime, usePromiseLoadingState } from './helpers'
import queryString from 'query-string'
import { AnnotatorContainer } from '../components/Annotator/Container';
import { ReportCard } from '../components/ReportCard';

const Scenarios = () => {
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

    return <>
        <Stack spacing={4} isInline>
            {tags.map(({ tag, count }, i) => {
                return <Tag key={i} onClick={() => selectTag(tag)} variantColor="gray">
                    <TagLabel>{tag} ({count})</TagLabel>
                </Tag>
            }) }
        </Stack>
        
        { loadingSearchResults && <p><CircularProgress isIndeterminate size="sm" color="green"/> Searching for {tagFilter}...</p> }
        
        { loadingSearchResults === false && <>
            {results.map((result, i) => {
                const day = getStartOfDayForTime(result.annotation.startTime)

                return <div key={i}>
                    <strong>{day.toFormat('DDD')}</strong>
                    <p>
                        Notes: {result.annotation.notes}
                    </p>
                    <Chart data={convertData(result.data)}/>
                </div>
            })}
        </>}
    </>
}

export default () => {
    return <ThemeProvider>
        <CSSReset />
        <Dashboard/>
    </ThemeProvider>
}