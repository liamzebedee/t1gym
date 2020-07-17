// https://bl.ocks.org/Ro4052/caaf60c1e9afcd8ece95034ea91e1eaa
import * as d3 from 'd3'
import { StatGroup, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, CircularProgress, Stack, Flex, Heading } from '@chakra-ui/core';

const SAMPLE_DATA = { "PGS": 92.58, "GVI": 1.5, "result": { "Low": { "midpoint": 323, "readingspct": "3.9", "mean": 68.3, "median": 70, "stddev": 8.8 }, "Normal": { "midpoint": 5111, "readingspct": "61.9", "mean": 130.8, "median": 129, "stddev": 25.5 }, "High": { "midpoint": 2824, "readingspct": "34.2", "mean": 231.7, "median": 217, "stddev": 48.4 } }, "hba1c": "7.3" }

import { calcStats } from '../../modeling/stats'
import { DateTime } from 'luxon'
import * as _ from 'lodash'
import { useEffect, useState, useCallback } from 'react';
import { Chart } from '../Chart';
import styles from './styles.module.css'
import { convertData } from '../../pages/helpers';

function dataToDayByDay(longitudalData) {
    let data = _.sortBy(longitudalData, ['date'])
    let day = DateTime
        .fromJSDate(new Date(data[0].date))
        .set({
            hour: 0,
            minute: 0,
            millisecond: 0
        })
        .plus({ day: 1 })

    let dayBuf = []
    let days = []

    data.forEach(el => {
        if (el.date > day.toMillis()) {
            // Advance day.
            day = day.plus({ day: 1 })
            days = [...days, dayBuf.slice()]
            dayBuf = []
        }

        dayBuf = [...dayBuf, el]
    })
    days = [...days, dayBuf]

    return days
}

// Return the index of the first Monday in `data`.
// Using this we can slice the data set, showing 
// a fixed layout of 5 weekdays and a 2 day weekend 
// (nous sommes en Australie, pas France).
function firstMonday(data) {
    for(let i = 0; i < data.length; i++) {
        const date = DateTime.fromJSDate(new Date(data[i].date))
        if(date.weekday == 1) return i
    }
    return null
}

export const ReportCard = ({ }) => {
    let [data, setData] = useState(null)
    let [statistics, setStatistics] = useState({
        PGS: null,
        hba1c: null
    })

    async function load() {
        const longitudalData = await fetch(`/api/stats`).then(res => res.json())

        // const statistics = calcStats(longitudalData)
        // TODO(liamz)
        const statistics = SAMPLE_DATA

        let data = []
        let days = dataToDayByDay(longitudalData)
        setData(
            days
                .map(day => {
                    const stats = calcStats(day)
                    return {
                        data: day,
                        date: new Date(day[0].date),
                        stats,
                    }
                })
            // .reverse()
        )
        setStatistics(statistics)
    }

    useEffect(() => {
        load()
    }, [])

    // Rescale the PGS value into
    // something which suits a linear colour scale.
    function rescalePgs(pgs) {
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

    /**
     * PGS <35 excellent glycemic status (non-diabetic)
     * PGS 35-100 good glycemic status (diabetic)
     * PGS 100-150 poor glycemic status (diabetic)
     * PGS >150 very poor glycemic status (diabetic)
     */
    // const color = x => d3.interpolateRdYlGn(1 - colorScale(x))
    const color = x => d3.interpolateRdYlGn(1 - rescalePgs(x))


    // simple grid
    // 7 days in a row
    // followed by newline

    const margin = {
        // top: 40 + 30,
        // left: 40 + 10,
        top: 0,
        left: 0
    }

    const ROW_WIDTH = 130
    const ROW_HEIGHT = 130

    const days = 5 * 7
    const dimensions = {
        width: margin.left + ROW_WIDTH * 7,
        height: margin.top + ROW_HEIGHT * (days / 7)
    }

    const [hoveredDay, setHoveredDay] = useState(null)
    const [selectedDay, setSelectedDay] = useState(null)

    function _onHoverDay(i) {
        setHoveredDay(i)
    }
    const onHoverDay = useCallback(_onHoverDay)

    function _onSelectDay(i) {
        setSelectedDay(i)
    }
    const onSelectDay = useCallback(_onSelectDay)

    let previewedDay = null
    if (selectedDay !== null) previewedDay = selectedDay
    else if (hoveredDay !== null) previewedDay = hoveredDay





    return <>
        <Flex direction="row">
            <StatGroup>
                <Stat>
                    <StatLabel>PGS</StatLabel>
                    <StatNumber>{statistics.PGS}</StatNumber>
                    <StatHelpText>
                        {/* <StatArrow type="increase" /> */}
                    </StatHelpText>
                </Stat>

                <Stat>
                    <StatLabel>HBa1c</StatLabel>
                    <StatNumber>{statistics.hba1c}%</StatNumber>
                    <StatHelpText>
                        {/* <StatArrow type="increase" /> */}
                        {/* 23.36% */}
                    </StatHelpText>
                </Stat>

                {/* <Stat>
                    <StatLabel>Progress since last month</StatLabel>
                    <StatNumber>45</StatNumber>
                    <StatHelpText>
                    <StatArrow type="decrease" />
                    9.05%
                    </StatHelpText>
                </Stat> */}
            </StatGroup>
        </Flex>

        <StatGroup>
            <Stat>
                <StatLabel>
                    <Heading size="lg" pb={5} pt={5}>30 Day Summary</Heading>
                </StatLabel>
            </Stat>
        </StatGroup>

        <Flex direction="row" >
            <Flex direction="column">
                {data === null && <CircularProgress isIndeterminate size="sm" color="green" />}
                <svg className={styles.reportCard} width={dimensions.width} height={dimensions.height} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
                    <g transform={`translate(${margin.left}, ${margin.top})`}>
                        {data && data.slice(firstMonday(data)).map((datum, i) => {
                            const { PGS } = datum.stats

                            const date = DateTime.fromJSDate(datum.date)
                            const weekend = date.weekday > 5

                            const beginsNewMonth = date.get('day') === 1 || i === 0
                            let dateStr
                            if (beginsNewMonth) {
                                dateStr = <tspan font-weight="bold">{date.toFormat(`MMM d`)}</tspan>
                            } else {
                                dateStr = date.toFormat(`d`)
                            }

                            return <g key={i}
                                transform={`translate(${ROW_WIDTH * (i % 7)}, ${ROW_HEIGHT * Math.floor(i / 7)} )`}
                                onMouseEnter={() => onHoverDay(i)}
                                onClick={() => onSelectDay(i)}
                                className={`${styles.day} ${i === selectedDay && styles.active}`}
                                width={ROW_WIDTH} height={ROW_HEIGHT}
                            >

                                <rect width={ROW_WIDTH} height={ROW_HEIGHT} className={weekend && styles.weekend}>
                                </rect>

                                <text textAnchor="start" class={styles.dateLabel} x={10} y={20}>
                                    {dateStr}
                                </text>

                                <g transform={`translate(65,75)`}>
                                    <circle r={45} cx={0} cy={0} fill={color(PGS)} />
                                    <text textAnchor="middle" class={styles.pgsLabel} dy=".3em">{PGS.toFixed(0)}</text>
                                </g>
                            </g>
                        })}
                    </g>
                </svg>
            </Flex>

            <Flex direction="column">
                {(previewedDay !== null) && <Chart data={convertData(data[previewedDay].data)} />}
            </Flex>
        </Flex>
    </>
}