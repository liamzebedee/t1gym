import * as d3 from 'd3'
import { StatGroup, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, CircularProgress, Stack, Flex } from '@chakra-ui/core';

const SAMPLE_DATA = {"PGS":92.58,"GVI":1.5,"result":{"Low":{"midpoint":323,"readingspct":"3.9","mean":68.3,"median":70,"stddev":8.8},"Normal":{"midpoint":5111,"readingspct":"61.9","mean":130.8,"median":129,"stddev":25.5},"High":{"midpoint":2824,"readingspct":"34.2","mean":231.7,"median":217,"stddev":48.4}},"hba1c":"7.3"}

import { calcStats } from '../../modeling/stats'
import { DateTime } from 'luxon'
import * as _ from 'lodash'
import { useEffect, useState, useCallback } from 'react';
import { Chart } from '../Chart';
import { convertData } from '../../pages/experiment';

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
        if(el.date > day.toMillis()) {
            // Advance day.
            day = day.plus({ day: 1 })
            days = [...days, dayBuf.slice()]
            dayBuf = []
        }
        
        dayBuf = [...dayBuf, el]
    })
    days = [ ...days, dayBuf ]

    return days
}

export const ReportCard = ({ statistics = SAMPLE_DATA }) => {
    let [data, setData] = useState(null)

    async function load() {
        const longitudalData = await fetch(`/api/stats`).then(res => res.json())

        let data = []
        let days = dataToDayByDay(longitudalData)
        setData(
            days.map(day => {
                const stats = calcStats(day)
                return {
                    data: day,
                    date: new Date(day[0].date),
                    stats,
                }
            })
            .reverse()
        )
    }

    useEffect(() => {
        load()
    }, [])
    
    // Rescale the PGS value into
    // something which suits a linear colour scale.
    function rescalePgs(pgs) {
        if(pgs <= 35) {
            return (pgs / 35) * (1/3)
        }
        if(pgs <= 100) {
            return (pgs / 100) * (2/3)
        }
        if(pgs <= 150) {
            return (pgs / 150) * (3/3)
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
        left: 40,
        top: 40
    }

    const ROW_WIDTH = 100
    const ROW_HEIGHT = 100

    const dimensions = {
        width: ROW_WIDTH*7,
        height: ROW_HEIGHT*4
    }

    const [hoveredDay, setHoveredDay] = useState(null)

    function _onHoverDay(i) {
        console.log(i)
        setHoveredDay(i)
    }
    const onHoverDay = useCallback(_onHoverDay)
    
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
        
        <Flex direction="row">
        <Flex direction="column">
            <StatGroup>
            <Stat>
            <StatLabel>30 Day Summary</StatLabel>
            </Stat>
            </StatGroup>

            <style>
            {`.report-card .day:hover {
                border: 1px solid #ddd;
            }`}
            </style>
            {data === null && <CircularProgress isIndeterminate size="sm" color="green"/> }
            <svg className="report-card" width={dimensions.width} height={dimensions.height} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
                <g transform={`translate(${margin.left}, ${margin.top})`}>
                    {data && data.map((data, i) => {
                        const { PGS } = data.stats
                        return <g key={i} transform={`translate(${ROW_WIDTH * (i % 7)}, ${ROW_HEIGHT * Math.floor(i/7)} )`} 
                            onMouseEnter={() => onHoverDay(i)} 
                            // onMouseLeave={() => onHoverDay(null)}
                            className="day"
                            >
                            <circle r={40} cx={0} cy={0} fill={color(PGS)}/>
                            <text textAnchor="middle" stroke="#332c2cbf" strokeWidth="1px" dy=".3em">{PGS.toFixed(0)}</text>
                        </g>
                    })}
                </g>
            </svg>
        </Flex>
        <Flex direction="column">
            { hoveredDay !== null && <Chart data={convertData(data[hoveredDay].data)} /> }
        </Flex>
        </Flex>
    </>
}