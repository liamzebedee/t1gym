// https://bl.ocks.org/Ro4052/caaf60c1e9afcd8ece95034ea91e1eaa
import * as d3 from 'd3'
import { StatGroup, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, CircularProgress, Stack, Flex, Heading, Text, Box } from '@chakra-ui/core';

const SAMPLE_DATA = { "PGS": 92.58, "GVI": 1.5, "result": { "Low": { "midpoint": 323, "readingspct": "3.9", "mean": 68.3, "median": 70, "stddev": 8.8 }, "Normal": { "midpoint": 5111, "readingspct": "61.9", "mean": 130.8, "median": 129, "stddev": 25.5 }, "High": { "midpoint": 2824, "readingspct": "34.2", "mean": 231.7, "median": 217, "stddev": 48.4 } }, "hba1c": "7.3" }

import { calcStats } from '../../modeling/stats'
import { DateTime } from 'luxon'
import * as _ from 'lodash'
import { useEffect, useState, useCallback } from 'react';
import { Chart } from '../Chart';
import styles from './styles.module.css'
import { convertData } from '../../pages/helpers';
import { useHoverPickSelector } from '../../misc/hooks';
import { tz } from '../../misc/wrappers';
import queryString from 'query-string'
import React from 'react';

// Buckets longitudalData into buckets lineated by day.
function dataToDayByDay(longitudalData) {
    let dataSortedByDate = _.sortBy(longitudalData, ['date'])

    const buckets = _.groupBy(dataSortedByDate, el => {
        const day = DateTime.fromMillis(el.date)
            .set({
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0,
            })
        return day.toString()
    })

    return Object.entries(buckets).map(([ day, data ]) => {
        return {
            day,
            data
        }
    })
}

const Blip = ({ pgs }) => {
    const r = 25/2
    return <svg style={{ display: 'inline' }} width={r*2} height={r*2}> 
        <circle r={r} cx={r} cy={r} fill={color(pgs)}></circle>
    </svg>
}

import { PROFILE } from '../../misc/constants'
import { ProgressCalendar } from './ProgressCalendar';
import { color } from './helpers';

export const ReportCard = ({ userProfile = PROFILE }) => {
    let [data, setData] = useState(null)
    let [statistics, setStatistics] = useState({
        PGS: null,
        hba1c: null
    })
    const [previewedDay, selectedDay, hoveredDay, onHoverDay, onSelectDay] = useHoverPickSelector()

    async function load() {
        const params = {
            tz
        }
        const longitudalData = await fetch(`/api/bgs/longitudal?${queryString.stringify(params)}`).then(res => res.json())

        const statistics = calcStats(longitudalData, userProfile)

        let data = []
        let days = dataToDayByDay(longitudalData)
        data = 
            days.map(({ day, data }) => {
                const stats = calcStats(data, userProfile)
                return { day, data, stats }
            })
            
        setData(data)
        setStatistics(statistics)
    }

    useEffect(() => {
        load()
    }, [])

    function renderPreview() {
        if(previewedDay !== null) {
            const day = _.find(data, { day: previewedDay })
            if(!day) return <Chart data={[]} />
            return <Chart data={convertData(day.data)} />
        }
    }

    return <>
        <p>Your target range is {(userProfile.targetRange.bgTargetBottom / 18.).toFixed(1)} - {(userProfile.targetRange.bgTargetTop / 18.).toFixed(1)} mmol/L.</p>
        <br/>
        <Flex direction="row">
            <Stack isInline={true} spacing={30}>
                {/* Stats. */}
                <Box>
                    <Heading size="sm">Personal Glycemic State</Heading>
                    <div>
                        <Text fontSize="2xl"><Blip pgs={statistics.PGS}/> {statistics.PGS}</Text>
                    </div>
                </Box>

                <Box>
                    <Heading size="sm">HBa1c est.</Heading>
                    <div>
                        <Text fontSize="2xl">{statistics.hba1c}%</Text>
                    </div>
                </Box>

                {/* <Stat>
                    <StatLabel>Progress since last month</StatLabel>
                    <StatNumber>45</StatNumber>
                    <StatHelpText>
                    <StatArrow type="decrease" />
                    9.05%
                    </StatHelpText>
                </Stat> */}
            </Stack>
        </Flex>

        <StatGroup>
            <Stat>
                <StatLabel>
                    <Heading size="lg" pb={5} pt={5}>30 Day Progress Report</Heading>
                </StatLabel>
            </Stat>
        </StatGroup>

        <Flex direction="row">
            {/* {data === null && <div>
                <CircularProgress isIndeterminate size="sm" color="green"/> Loading BG's from Nightscout...
            </div>} */}

            <ProgressCalendar   
                {...{
                    data, previewedDay, selectedDay, hoveredDay, onHoverDay, onSelectDay
                }}/>
            
            {renderPreview()}
        </Flex>
    </>
}