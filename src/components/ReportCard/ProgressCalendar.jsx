import * as d3 from 'd3'
import { StatGroup, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, CircularProgress, Stack, Flex, Heading, Text, Box } from '@chakra-ui/core';
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
import { color } from './helpers';
import { HOUR } from '../../model';

export const ProgressCalendar = ({ loading, data, previewedDay, selectedDay, hoveredDay, onHoverDay, onSelectDay }) => {
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
    
    return <svg 
        className={`${styles.reportCard} ${loading && styles.loading}`} 
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>

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
                // TODO: refactor this disgusting mess.
                if(datum && datum.stats && !date.equals(today) && datum.stats.totalMinutesMissingData < 60*6) {
                    const { PGS } = datum.stats
                    pgs = <g 
                        transform={`translate(65,80)`}
                        >
                        <circle r={40} cx={0} cy={0} fill={color(PGS)} />
                        <text textAnchor="middle" class={styles.pgsLabel} dy=".3em">{PGS.toFixed(0)}</text>
                    </g>
                } else if(date.ordinal < today.ordinal && (!datum || datum.stats.totalMinutesMissingData > 60*3)) {
                    pgs = <g transform={`translate(65,80)`}>
                        <circle r={40} cx={0} cy={0} fill={'#8080802e'} />
                        <text textAnchor="middle" class={styles.pgsLabel} dy=".3em"></text>
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
                    onClick={() => onSelectDay(dateKey)}>
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
}