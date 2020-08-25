
import * as d3 from "d3";
import React, { useEffect, useRef, useState } from 'react';
import { intervalSearch } from "../../pages/helpers";

import { Duration, DateTime } from 'luxon'

import { v4 as uuidv4 } from 'uuid';
import styles from './styles.module.css'
import { functions, MINUTE, compose, SECOND } from "../../model";


import { PROFILE } from '../../misc/constants'

export const Chart = (props) => {
    let onEndBrush = props.onEndBrush || function () { }
    const data = _.sortBy(props.data, 'date')

    const annotations = props.annotations || []
    const events = props.events || []

    // Layout.
    // 
    
    const tempBasalArea = {
        height: 200,
        marginTop: 50
    }

    let margin = { top: 1, right: 30, bottom: 30, left: 60 }
    
    let width = 1200
    let height = 400
    
    if(!props.showTempBasalChart) {
        height += tempBasalArea.height
    }


    // 
    // x and y curves.
    // 

    // Domain is supposed to be a full day by default.
    let extent = d3.extent(data, function (d) { return d.date })
    function calcExtent(extent, dynamicExtent) {
        if (dynamicExtent) return extent
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
        .domain(calcExtent(extent, props.dynamicExtent))
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
        start: PROFILE.targetRange.bgTargetBottom / 18.,
        end: PROFILE.targetRange.bgTargetTop / 18.
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

    const transformedEvents = events
        .filter(event => {
            switch(event.eventType) {
                case 'Meal Bolus':
                case 'Correction Bolus':
                    return true
                default:
                    return false
            }
        })

    function bgY(date) {
        const yi = yIdx(data, date)
        if(yi === 0) return data[yi]
        else return data[yi - 1]
    }

    function generateTempBasalEntries(fromDate, toDate) {
        let entries = []
        let intervals = []

        events
        .filter(event => event.eventType === 'Temp Basal')
        .map((event, i) => {
            const {
                duration,
                rate,
                timestamp
            } = event
            
            let date = +new Date(timestamp)
            const from = date
            const to = DateTime.fromJSDate(new Date(date))
                .plus({ minutes: duration })
                .toMillis()
            
            intervals.push({
                from,
                to,
                rate,
                duration
            })
        })
        

    }
        
    return <>
    <svg
        // width={'100%'} height={'100%'}
        viewBox={`0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom + tempBasalArea.height + tempBasalArea.marginTop}`}
        className={styles.chart}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Axes. */}
            <g ref={axisRef}>
            </g>
            <g ref={axisRef2} transform={"translate(0," + height + ")"}>
            </g>

            <g ref={svgRef}>
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
                {/* {transformedEvents.map((event, i) => {
                    let fill
                    let text
                    let scaleFactor = 1

                    switch(event.eventType) {
                        case 'Meal Bolus':
                            fill = 'red'
                            let parts = []
                            // if(event.insulin) parts.push(`${event.insulin}U`)
                            if(event.carbs) parts.push(`${event.carbs}g`)
                            text = parts.join(' ')
                            scaleFactor = event.carbs / 15
                            break
                        case 'Correction Bolus':
                            fill = 'blue'
                            text = event.insulin
                            scaleFactor = event.insulin / 1
                            return
                            break
                        default:
                            return null
                    }
                    
                    const date = new Date(event.timestamp)
                    const u = yIdx(data, date)
                    const u2 = data[u-1]
                    
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
                })} */}


                {/* 
                    Treatments. 
                */}
                
                {/* Carbohydrates. */}
                {transformedEvents.map((event, i) => {
                    let carbs
                    switch(event.eventType) {
                        case 'Meal Bolus':
                            carbs = event.carbs
                            break
                        default:
                            return null
                    }

                    if(!carbs) return

                    const date = new Date(event.timestamp)
                    if(date < extent[0]) return // TODO(liamz): quick hack to work around out-of-date-range events.
                    const CARB_SCALE_FACTOR = 3
                    const height = carbs * CARB_SCALE_FACTOR

                    return <g className={styles.carbsBar} transform={`translate(${x(date)}, ${y(0)})`}>
                        <rect y={-height} height={height} width="5"></rect>

                        <text y={-height - 20}>
                            {`${carbs}g`}
                        </text>
                    </g>
                })}

                {/* Insulin dosages. */}
                {transformedEvents.map((event, i) => {
                    let insulin
                    switch(event.eventType) {
                        case 'Meal Bolus':
                        case 'Correction Bolus':
                            insulin = event.insulin
                            break
                        default:
                            return null
                    }

                    if(!insulin) return

                    const date = new Date(event.timestamp)
                    if(date < extent[0]) return // TODO(liamz): quick hack to work around out-of-date-range events.
                    const INSULIN_SCALE_FACTOR = 15
                    const height = insulin * INSULIN_SCALE_FACTOR

                    return <g className={styles.insulinBar} transform={`translate(${x(date)}, ${y(0)})`}>
                        <rect y={-height} height={height} width="5"></rect>

                        <text y={-height - 20}>
                            {`${insulin.toFixed(1)}U`}
                        </text>
                    </g>
                })}


                {/* In range box. */}
                <rect
                    x={0}
                    y={y(inRangeShapeDescription.end)}
                    width={width}
                    height={y(inRangeShapeDescription.start) - y(inRangeShapeDescription.end)}
                    stroke='black'
                    fill='#7fff7f30' />
            </g>
        </g>
        
        {props.showTempBasalChart &&
        <g transform={`translate(${margin.left}, ${margin.top + height + tempBasalArea.marginTop})`}>
            <TempBasalChart
                height={tempBasalArea.height}
                width={width}
                extent={calcExtent(extent)}
                events={events}
                />
        </g> }
    </svg>
    </>
}

export const TempBasalChart = ({ height = 200, width, extent, events }) => {
    const x = d3.scaleTime()
        .domain(extent)
        .range([0, width])
        // .clamp(true)

    const MAX_TEMP_BASAL_UNITS = 6
    const y = d3.scaleLinear()
        .domain([0, MAX_TEMP_BASAL_UNITS])
        .range([height, 0])
        // We clamp the range, as I've noticed Loop has erroneously recorded
        // a temp basal much above the user-defined safety limits. The basal was
        // 35U for 2mins or so. Clamping is a simple sanity check for this
        // behaviour, as it is usually replaced by a reasonable temp.
        .clamp(true)


    const xAxisRef = el => {
        el && d3.select(el).call(
            d3.axisLeft(y)
        )
    }

    let flip = false
    const yAxisRef = el => {
        let yAxis = d3.axisBottom(x).ticks(5)
        d3.select(el).call(yAxis)
    }

    const data = events
        .filter(event => event.eventType === 'Temp Basal')
        .map((event, i) => {
            const {
                duration,
                rate
            } = event

            const date = new Date(event.timestamp)
            const expires = new Date(date.getTime() + (duration * MINUTE))
            return { date, expires, duration, rate }
        })
        // .filter(d => d.duration > 6)
    

    const area = d3.area()
        .x(d => x(d.date))
        .x0(d => x(d.expires))
        .y0(height)
        .y1(function(d) { return y(d.rate) })
        .defined(d => d.rate !== 0)
        .curve(d3.curveStep)

    return <g transform='translate(0,00)'>
        {/* Axes. */}
        <g ref={xAxisRef}>
        </g>
        <g ref={yAxisRef} transform={`translate(0, ${height})`}>
        </g>

        <path
            d={area(data)}
            class={styles.tempBasal}/>
    </g>
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



    {
 "_id": "5f1610b68b6aca48aacec0ec",
 "duration": 30,
 "raw_duration": {
  "timestamp": "2020-07-21T07:44:22+10:00",
  "_type": "TempBasalDuration",
  "id": "FgFW7AdVFA==",
  "duration (min)": 30
 },
 "timestamp": "2020-07-21T07:44:22+10:00",
 "absolute": 1.35,
 "rate": 1.35,
 "raw_rate": {
  "timestamp": "2020-07-21T07:44:22+10:00",
  "_type": "TempBasal",
  "id": "MzZW7AdVFAA=",
  "temp": "absolute",
  "rate": 1.35
 },
 "eventType": "Temp Basal",
 "medtronic": "mm://openaps/mm-format-ns-treatments/Temp Basal",
 "created_at": "2020-07-20T21:44:22.000Z",
 "enteredBy": "openaps://medtronic/722",
 "utcOffset": 600,
 "carbs": null,
 "insulin": null
}
    */
