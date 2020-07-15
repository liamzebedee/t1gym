
import * as d3 from "d3";
import { useEffect, useRef, useState } from 'react';
import { intervalSearch } from "../../pages/helpers";

import { Duration, DateTime } from 'luxon'

    let margin = { top: 1, right: 30, bottom: 30, left: 60 }
    const width = 900
    const height = 600

    // 
    // x and y curves.
    // 

    // Domain is supposed to be a full day by default.
    let extent = d3.extent(data, function (d) { return d.date })
    function calcExtent(extent) {
        let start = DateTime.fromJSDate(new Date(extent[0])).set({
            hour: 0,
            minute: 0
        })
        let end = start.plus({ days: 1 })
        console.log([start, end].map(x=>x.toString()), new Date(start.toMillis()))
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
        el && d3.select(el).call(
            d3.axisBottom(x)
            .ticks(d3.timeMinute.every(120))
            .tickFormat(x => {
                flip = !flip
                if(flip) return ''
                return d3.timeFormat("%I %p")(x)
            })
        )
    }


    const lineFunc = d3.line()
        .x(function (d) { return x(d.date) })
        .y(function (d) { return y(d.sgv) })


    // The most ridiculously simple hack.
    const bglColorId = "bg-color-"+Math.random()

    const inRangeShapeDescription = {
        start: 5,
        end: 10
    }


    const svgRef = el => {
        if(!el) return
        // Add brushing
        d3.select(el)
        .call(d3.brushX()
            .extent([[0, 0], [width, height]])
            .on("end", function() {
                let extent = d3.event.selection
                if(extent != null) {
                    onEndBrush(extent.map(x.invert))
                } else {
                    onEndBrush(extent)
                }
            })
        )

    }

    return <svg width={width + margin.left + margin.right} height={height + margin.top + margin.bottom} >
        <g ref={svgRef} transform={`translate(${margin.left}, ${margin.top})`}>

        {/* Axes. */}
        <g ref={axisRef}>
        </g>
        <g ref={axisRef2} transform={"translate(0," + height + ")"}>
        </g>

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
                return <stop key={i} offset={x(d.date) / width} stopColor={getStopColor(d)}/>
            })}
        </linearGradient>

        <path 
            d={lineFunc(data)}
            fill="none"
            stroke={`url(#${bglColorId})`}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"/>
        
        {/* Box */}
        <rect
            x={0}
            y={y(inRangeShapeDescription.end)}
            width={width}
            height={y(inRangeShapeDescription.start) - y(inRangeShapeDescription.end)}
            stroke='black'
            fill='#7fff7f30'/>
            </g>
    </svg>
}



    // Add panning.
    // var zoom = d3.zoom()
    // .translateExtent([[0, 0],[800, 600]])
    // .on('zoom', function(){
    //       svg.attr('transform', d3.event.transform);
    // })
    // .x(x)
    // .y(y)
    // .scaleExtent([1, 32])
    // .on("zoom", zoomed)

    // svg.call(zoom)

    // function dragstarted() {
    //     d3.select(this).raise();
    //     g.attr("cursor", "grabbing");
    //   }
    
    //   function dragged(d) {
    //     d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    //   }
    
    //   function dragended() {
    //     g.attr("cursor", "grab");
    //   }
    // g.call(d3.drag()
    // .on("start", dragstarted)
    // .on("drag", dragged)
    // .on("end", dragended));