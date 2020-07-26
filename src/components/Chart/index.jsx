
import * as d3 from "d3";
import React, { useEffect, useRef, useState } from 'react';
import { intervalSearch } from "../../pages/helpers";

import { Duration, DateTime } from 'luxon'

import { v4 as uuidv4 } from 'uuid';
import styles from './styles.module.css'
import { functions, MINUTE, compose, SECOND } from "../../model";


function calcStats(treatments, extent) {
    let fns = []
    
    const insulinOnBoard = (amount, startTime) => {
        const insulinActive = functions.fiaspInsulinActive(amount)
        return u => {
            const tickerFn = functions.beginsAfter({ start: startTime })
            const ticker = tickerFn(u)
            if(ticker === 0) return 0
            return amount - insulinActive(ticker)
        }
    }

    const treatmentsSortedByDate = _.sortBy(
        treatments.map(treatment => {
            return {
                ...treatment,
                startTime: +new Date(treatment.timestamp)
            }
        }), 
        'startTime'
    )
    
    const insulinTreatments = treatmentsSortedByDate
        .filter(event => {
            switch(event.eventType) {
                case 'Meal Bolus':
                    // Some Meal Boluses don't have insulin.
                    if(!event.insulin) return false
                case 'Correction Bolus':
                    return true
                default:
                    return false
            }
        })

    const insulinFns = insulinTreatments
        .map(treatment => {
            const amount = treatment.insulin
            return insulinOnBoard(amount, treatment.startTime)
        })
    
    let iobs = []

    for(let date = extent[0]; date <= extent[1]; date += 60*5*SECOND) {
        const iob = insulinFns.map(f => f(date)).reduce((prev, curr) => prev + curr, 0)
        iobs.push({
            iob,
            date
        })
    }

    return iobs
}

export const Chart = (props) => {
    let onEndBrush = props.onEndBrush || function () { }
    const data = _.sortBy(props.data, 'date')

    const annotations = props.annotations || []
    const events = props.events || []

    let margin = { top: 1, right: 30, bottom: 30, left: 60 }
    const width = 1200
    const height = 600

    // 
    // x and y curves.
    // 

    // Domain is supposed to be a full day by default.
    let extent = d3.extent(data, function (d) { return d.date })
    function calcExtent(extent) {
        if (props.dynamicExtent) return extent
        let start = DateTime.fromJSDate(new Date(extent[0])).set({
            hour: 0,
            minute: 0
        })
        let end = start.plus({ days: 1 })
        return [
            start.toMillis(),
            end.toMillis()
        ]
    }

    const x = d3.scaleTime()
        .domain(calcExtent(extent))
        .range([0, width])
        .clamp(true)

    const y = d3.scaleLinear()
        .domain([0, 23])
        .range([height, 0])


    const axisRef = el => {
        el && d3.select(el).call(
            d3.axisLeft(y)
        )
    }


    let flip = false
    const axisRef2 = el => {
        let yAxis = d3.axisBottom(x)
        if (!props.dynamicExtent) {
            yAxis = yAxis
                .ticks(d3.timeMinute.every(120))
                .tickFormat(x => {
                    flip = !flip
                    if (flip) return ''
                    const timeStr = d3.timeFormat("%I %p")(x)
                    if(timeStr[0] === '0') return timeStr.slice(1)
                    return timeStr
                })
        }
        d3.select(el).call(yAxis)
    }

    const bgLine = d3.line()
        // .curve(d3.curveLinear)
        .curve(d3.curveCatmullRomOpen)
        .defined(d => d.sgv != 0)
        .x(function (d) { return x(d.date) })
        .y(function (d) { return y(d.sgv) })


    // The most ridiculously simple hack.
    const bglColorId = `bg-color-${uuidv4()}`

    const inRangeShapeDescription = {
        start: 5,
        end: 10
    }


    const svgRef = el => {
        if (!el) return
        // Add brushing
        d3.select(el)
            .call(d3.brushX()
                .extent([[0, 0], [width, height]])
                .on("end", function () {
                    let extent = d3.event.selection
                    if (extent != null) {
                        onEndBrush(extent.map(x.invert))
                    } else {
                        onEndBrush(extent)
                    }
                })
            )
    }


    const yIdx = d3.bisector(d => d.date).right

    let transformedEvents = events
    .filter(event => {
        switch(event.eventType) {
            case 'Meal Bolus':
            case 'Correction Bolus':
                return true
            default:
                return false
        }
    })

    const iobData = calcStats(events, extent)

    function bgY(date) {
        const yi = yIdx(data, date)
        if(yi === 0) return data[yi]
        else return data[yi - 1]
    }
    
    // Show insulin 
    // const IOB_Y_SCALE_FACTOR = 2.0

    // const iobLine = d3.line()
    //     .x(function (d) { return x(d.date) })
    //     .y(function (d) { 
    //         const y1 = bgY(d.date).sgv
    //         const yIOB = d.iob
    //         return y(y1 + yIOB)
    //     })

    var iobAreaLine = d3.area()
        .curve(d3.curveBasis)
        .x(function(d) { return x(d.date) })
        .y1(function (d) { 
            const y1 = bgY(d.date).sgv
            const yIOB = d.iob
            return y(y1 + yIOB)
        })
        .y0(function (d) { 
            const y1 = bgY(d.date).sgv
            return y(y1)
        })
        .defined(d => d.iob > 0.1)
    

        
    return <svg
        // width={'100%'} height={'100%'}
        viewBox={`0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`}
        className={styles.chart}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>

            {/* Axes. */}
            <g ref={axisRef}>
            </g>
            <g ref={axisRef2} transform={"translate(0," + height + ")"}>
            </g>

            <g ref={svgRef}>
                {/* IOB */}
                <path
                    d={iobAreaLine(iobData)}
                    fill="rgba(0,128,255,0.2)"
                    stroke={`rgba(0,128,255,0.5)`}
                    strokeWidth={2} />
                
                {/* Line */}
                <linearGradient
                    id={bglColorId}
                    gradientUnits="userSpaceOnUse"
                    x1={0}
                    x2={width}>
                    {data.map((d, i) => {
                        function getStopColor(d) {
                            return intervalSearch([
                                [0, 'red'],
                                [3.9, 'orange'],
                                [5, 'green'],
                                [10, 'orange'],
                                [13, 'red']
                            ], d.sgv)
                        }
                        return <stop key={i} offset={x(d.date) / width} stopColor={getStopColor(d)} />
                    })}
                </linearGradient>

                {/* https://observablehq.com/@d3/line-with-missing-data */}
                {/* Dotted line for missing/extrapolated data. */}
                {/* <path 
                d={bgLine(data.filter(bgLine.defined()))}
                fill="none"
                stroke="grey" 
                stroke-dasharray="4 4"
                strokeWidth={1}
                /> */}

                {/* Coloured BG line for real data. */}
                <path
                    // d={bgLine( data.filter(bgLine.defined()) )}
                    opacity={annotations.length ? 0.5 : 1}
                    d={bgLine(data)}
                    fill="none"
                    stroke={`url(#${bglColorId})`}
                    strokeWidth={2} />

                {/* Annotations. */}
                {annotations.map(annotation => {
                    const { startTime, endTime } = annotation
                    const annotationData = data.filter(d => {
                        return (d.date >= startTime) && (d.date <= endTime)
                    })
                    const el = <path
                        d={bgLine(annotationData)}
                        fill="none"
                        stroke={`url(#${bglColorId})`}
                        strokeWidth={4} />;
                    return el
                })}

                {/* Events. */}
                {transformedEvents.map((event, i) => {
                    let fill
                    let text
                    let scaleFactor = 1

                    switch(event.eventType) {
                        case 'Meal Bolus':
                            fill = 'red'
                            let parts = []
                            if(event.insulin) parts.push(`${event.insulin}U`)
                            if(event.carbs) parts.push(`${event.carbs}g`)
                            text = parts.join(' ')
                            scaleFactor = event.carbs / 15
                            break
                        case 'Correction Bolus':
                            fill = 'blue'
                            text = event.insulin
                            scaleFactor = event.insulin / 1
                            break
                        default:
                            return null
                    }
                    
                    const date = new Date(event.timestamp)
                    const u = yIdx(data, date)
                    const u2 = data[u-1]
                    if(!u2) debugger
                    
                    const el = <g
                        transform={`translate(${x(date)}, ${y(u2.sgv)})`}
                        key={uuidv4()}>
                            <circle 
                                x={0}
                                y={0}
                                // r={5 * scaleFactor}
                                r={10}
                                fill={fill}
                            />

                            <text 
                                // textAnchor="middle"
                                y={-20}
                                transform={`rotate(-45deg)`}
                                stroke={fill}>
                                {text}
                            </text>
                    </g>
                    
                    return el
                })}

                {/* Box */}
                <rect
                    x={0}
                    y={y(inRangeShapeDescription.end)}
                    width={width}
                    height={y(inRangeShapeDescription.start) - y(inRangeShapeDescription.end)}
                    stroke='black'
                    fill='#7fff7f30' />
            </g>
        </g>
{/* 
        <g>

        </g> */}
    </svg>
}



// Treatment schema.
// 
/*
    {
        "_id": "5f1904678b6aca48aaf74218",
        "timestamp": "2020-07-22T01:53:48Z",
        "insulin": 1.2,
        "created_at": "2020-07-22T01:53:48.000Z",
        "unabsorbed": 0,
        "type": "normal",
        "enteredBy": "loop://Liam Edwards-Playne’s iPhone",
        "eventType": "Correction Bolus",
        "duration": 0.8,
        "programmed": 1.2,
        "utcOffset": 0
    }

    {
        "_id": "5f1afb118b6aca48aa123400",
        "duration": 0,
        "bolus": {
        "timestamp": "2020-07-22T00:01:59+10:00",
        "_type": "Bolus",
        "id": "AVJSAHvBQBYU",
        "amount": 8.2,
        "programmed": 8.2,
        "unabsorbed": 0,
        "duration": 0
        },
        "timestamp": "2020-07-22T00:01:59+10:00",
        "created_at": "2020-07-21T14:01:59.000Z",
        "carbs": 82,
        "ratio": "10",
        "wizard": {
            "timestamp": "2020-07-22T00:01:59+10:00",
            "_type": "BolusWizard",
            "id": "WwB7wQAWFFKQChlBAFIAAAAAUkE=",
            "carb_input": 82,
            "carb_ratio": 10,
            "correction_estimate": 0,
            "food_estimate": 8.2,
            "unabsorbed_insulin_total": 0,
            "bolus_estimate": 8.2,
            "bg": 0,
            "bg_target_low": 6.5,
            "bg_target_high": 6.5,
            "sensitivity": 2.5,
            "units": "mmol"
        },
        "eventType": "Meal Bolus",
        "insulin": 8.2,
        "notes": "Normal bolus with wizard.\nCalculated IOB: -0.203\nProgrammed bolus 8.2\nDelivered bolus 8.2\nPercent delivered:  100%\nFood estimate 8.2\nCorrection estimate 0\nBolus estimate 8.2\nTarget low 6.5\nTarget high 6.5\nHypothetical glucose delta -20.5",
        "medtronic": "mm://openaps/mm-format-ns-treatments/Meal Bolus",
        "enteredBy": "openaps://medtronic/722",
        "utcOffset": 600
    }
    */
