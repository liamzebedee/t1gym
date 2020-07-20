
import * as d3 from "d3";
import React, { useEffect, useRef, useState } from 'react';
import { intervalSearch } from "../../pages/helpers";

import { Duration, DateTime } from 'luxon'

import { v4 as uuidv4 } from 'uuid';
import styles from './styles.module.css'



export const Chart = (props) => {
    let onEndBrush = props.onEndBrush || function () { }
    const data = _.sortBy(props.data, 'date')

    const annotations = props.annotations || []

    let margin = { top: 1, right: 30, bottom: 30, left: 60 }
    const width = 900
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
        console.log([start, end].map(x => x.toString()), new Date(start.toMillis()))
        return [
            start.toMillis(),
            end.toMillis()
        ]
    }

    var x = d3.scaleTime()
        .domain(calcExtent(extent))
        .range([0, width])
        .clamp(true)

    var y = d3.scaleLinear()
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
        .curve(d3.curveLinear)
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

    return <svg
        width={width + margin.left + margin.right}
        height={height + margin.top + margin.bottom}
        viewBox={`0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`}>
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

        {/* Annotations */}
        {/* <g>
            {annotations.map(annotation => {
                const { date } = annotation
                return <circle x={x(date)} className={styles.annotation}></circle>
            })}
        </g> */}
    </svg>
}