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

// Rescale the PGS value into
// something which suits a linear colour scale.
function rescalePgs(pgs) {
    /**
     * PGS <35 excellent glycemic status (non-diabetic)
     * PGS 35-100 good glycemic status (diabetic)
     * PGS 100-150 poor glycemic status (diabetic)
     * PGS >150 very poor glycemic status (diabetic)
     */
    if (pgs <= 35) {
        return (pgs / 35) * (1 / 3)
    }
    if (pgs <= 100) {
        return (pgs / 100) * (2 / 3)
    }
    if (pgs <= 150) {
        return (pgs / 150) * (3 / 3)
    }
    return 1
}

const color = x => d3.interpolateRdYlGn(1 - rescalePgs(x))

const Blip = ({ pgs }) => {
    const r = 25/2
    return <svg style={{ display: 'inline' }} width={r*2} height={r*2}> 
        <circle r={r} cx={r} cy={r} fill={color(pgs)}></circle>
    </svg>
}

const PROFILE = {
    targetRange: {
        bgHigh: 260, 
        bgTargetTop: 180, 
        bgTargetBottom: 80, 
        bgLow: 55
    }
}

export const ReportCard = ({ userProfile = PROFILE }) => {
    let [data, setData] = useState(null)
    let [statistics, setStatistics] = useState({
        PGS: null,
        hba1c: null
    })

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

    const margin = {
        top: 0,
        left: 0
    }

    const ROW_WIDTH = 130
    const ROW_HEIGHT = 130

    const NUM_DAYS_TO_DISPLAY = 5 * 7
    const dimensions = {
        width: margin.left + ROW_WIDTH * 7,
        height: margin.top + ROW_HEIGHT * (NUM_DAYS_TO_DISPLAY / 7)
    }

    const [previewedDay, selectedDay, hoveredDay, onHoverDay, onSelectDay] = useHoverPickSelector()


    const dateRange = {
        fromDate: null,
        toDate: null
    }
    const today = DateTime
        .local()
        .set({
            hour: 0,
            minute: 0,
            second: 0,
            millisecond: 0
        })
    
    // We show a fixed-width layout, with weeks beginning on Monday and ending on Sunday.
    // fromDate should thus be a Monday, and toDate a Sunday.
    // We count backwards from toDate.
    const endOfThisWeek = today.plus({ days: 7 - today.weekday })
    dateRange.fromDate = endOfThisWeek.minus({ days: NUM_DAYS_TO_DISPLAY })
    dateRange.toDate = endOfThisWeek    

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
            <Flex direction="column" flex="1">
                {data === null && <div>
                    <CircularProgress isIndeterminate size="sm" color="green"/> Loading BG's from Nightscout...
                </div>}

                <svg 
                className={styles.reportCard} 
                viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                >
                    <g transform={`translate(${margin.left}, ${margin.top})`}>
                        {_.range(NUM_DAYS_TO_DISPLAY).map((dayIdx, i, daysToDisplay) => {
                            const date = dateRange.fromDate.plus({ days: dayIdx+1 })
                            const dateKey = date.toString()
                            const datum = _.find(data, { day: dateKey })

                            const weekend = date.weekday > 5

                            const beginsNewMonth = date.get('day') === 1 || i === 0
                            let dateStr
                            if (beginsNewMonth) {
                                dateStr = <tspan font-weight="bold">{date.toFormat(`MMM d`)}</tspan>
                            } else if (date.equals(today)) {
                                dateStr = 'Today'
                            } else {
                                dateStr = date.toFormat(`d`)
                            }

                            // Show PGS only if the day contained data.
                            let pgs
                            if(datum && datum.stats) {
                                const { PGS } = datum.stats
                                pgs = <g 
                                    transform={`translate(65,80)`}
                                    >
                                    <circle r={40} cx={0} cy={0} fill={color(PGS)} />
                                    <text textAnchor="middle" class={styles.pgsLabel} dy=".3em">{PGS.toFixed(0)}</text>
                                </g>
                            } else {
                                pgs = <g transform={`translate(65,80)`}>
                                    <circle r={40} cx={0} cy={0} fill={'#8080802e'} />
                                    <text textAnchor="middle" class={styles.pgsLabel} dy=".3em"></text>
                                </g>
                            }

                            return <g key={i}
                                transform={`translate(${ROW_WIDTH * (i % 7)}, ${ROW_HEIGHT * Math.floor(i / 7)} )`}
                                className={`${styles.day} ${dateKey === selectedDay && styles.active}`}
                                width={ROW_WIDTH} height={ROW_HEIGHT}
                                onMouseEnter={() => onHoverDay(dateKey)}
                                onMouseLeave={() => onHoverDay(null)}
                                onClick={() => onSelectDay(dateKey)}
                            >
                                <rect width={ROW_WIDTH} height={ROW_HEIGHT} className={weekend && styles.weekend}>
                                </rect>
                                
                                <text textAnchor="start" class={styles.dateLabel} x={15} y={25}>
                                    {dateStr}
                                </text>

                                {pgs}
                            </g>
                        })}
                    </g>
                </svg>
            </Flex>

            <Flex direction="column" flex="1">
                {renderPreview()}
            </Flex>
        </Flex>
    </>
}