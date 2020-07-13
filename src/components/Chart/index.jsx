
import * as d3 from "d3";
import { useEffect, useRef, useState } from 'react';

export const Chart = ({ data, onEndBrush }) => {
    let margin = { top: 1, right: 30, bottom: 30, left: 60 }
    const width = 900
    const height = 600

    // 
    // x and y curves.
    // 
    var x = d3.scaleTime()
        .domain(d3.extent(data, function (d) { return d.date }))
        .range([0, width])

    var y = d3.scaleLinear()
        .domain([0, 23])
        .range([height, 0])
    

    const axisRef = el => {
        el && d3.select(el).call(
            d3.axisLeft(y)
        )
    }
    const axisRef2 = el => {
        el && d3.select(el).call(
            d3.axisBottom(x)
        )
    }


    const lineFunc = d3.line()
        .x(function (d) { return x(d.date) })
        .y(function (d) { return y(d.sgv) })


    const bglColorId = "bg-color"

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
            {data.map(d => {
                function getStopColor(d) {
                    if (d.sgv > 13) {
                        return 'red'
                    }
                    if (d.sgv > 10) {
                        return 'orange'
                    }
                    if (d.sgv < 3.9) {
                        return 'red'
                    }
                    if (d.sgv < 5) {
                        return 'orange'
                    }
                    else return 'green'
                }
                return <stop offset={x(d.date) / width} stopColor={getStopColor(d)}/>
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