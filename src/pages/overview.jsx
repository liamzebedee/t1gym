// https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4543190/#!po=21.4286
import { formatPlotlyDate } from './experiment'
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
                <Tab>Overview</Tab>
                <Tab>Analyse</Tab>
                <Tab>Patterns</Tab>
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


import { Scenarios } from '../components/Scenarios'
import { getStartOfDayForTime, usePromiseLoadingState, convertData } from './helpers'
import { AnnotatorContainer } from '../components/Annotator/Container';
import { ReportCard } from '../components/ReportCard';



export default () => {
    return <ThemeProvider>
        <CSSReset />
        <Dashboard/>
    </ThemeProvider>
}