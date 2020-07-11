// Show data on plot.
// [x] Show a plot line.
// [x] Show axes.
// [x] Select from day by day of data.
// [x] Drag to select range.
// [] Save annotations to database
// [] Grab and move graph.
// [] Navigate between days in nightscout.



import { Textarea, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, NumberInput, Stack, FormControl, FormLabel, CSSReset, Heading, Box, Flex, IconButton, Button, ButtonGroup } from "@chakra-ui/core";

import latestGlucoseFeed from '../../data/glucose.json'
import { convertData, formatPlotlyDate } from './index'
import * as d3 from "d3";
import { useEffect, useRef, useState } from 'react';


const data = convertData(latestGlucoseFeed)


function renderChart(el, data, onStartBrush, onEndBrush) {
    // create data
    // var data = [{x: 0, y: 20}, {x: 150, y: 150}, {x: 300, y: 100}, {x: 450, y: 20}, {x: 600, y: 130}]

    // create svg element:
    let margin = { top: 10, right: 30, bottom: 30, left: 60 }
    const width = 900
    const height = 600
    var svg = d3.select(el).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // 
    // x and y curves.
    // 
    var x = d3.scaleTime()
        .domain(d3.extent(data, function (d) { return d.date }))
        .range([0, 1000])

    var y = d3.scaleLinear()
        .domain([0, 23])
        .range([height, 0])


    // 
    // Box - In range.
    // 
    const inRangeShapeDescription = {
        start: 5,
        end: 10
    }

    svg.append('rect')
        .attr('x', 0)
        .attr('y', y(inRangeShapeDescription.end))
        .attr('width', width + margin.left)
        .attr('height', y(inRangeShapeDescription.start) - y(inRangeShapeDescription.end))
        .attr('stroke', 'black')
        .attr('fill', '#7fff7f30')


    // 
    // Render glucose line and axes.
    // 

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(
            d3.axisBottom(x)
            // .ticks(d3.timeMinute, 10)
            // .tickFormat(d3.timeFormat("%M"))
        )


    const lineFunc = d3.line()
        .x(function (d) { return x(d.date) })
        .y(function (d) { return y(d.sgv) })


    const bglColorId = "bg-color"

    svg.append("linearGradient")
        .attr("id", bglColorId)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0)
        .attr("x2", width)
        .selectAll("stop")
        .data(data)
        .join("stop")
        .attr("offset", d => x(d.date) / width)
        .attr("stop-color", d => {
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
        })

    svg.append("path")
        .datum(data)
        .attr("d", lineFunc(data))
        .attr("fill", "none")
        .attr("stroke", `url(#${bglColorId})`)
        .attr("stroke-width", 2)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")


    // Add brushing
    svg
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
    
    // Add panning.
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
}

import { Tag, TagIcon, TagLabel, TagCloseButton } from "@chakra-ui/core";
import DateTime from 'react-datetime'

import { AnnotationInputControl } from '../components/AnnotationInputControl'
import { TagsEditor } from '../components/TagsEditor'


const Annotator = () => {
    const d3Container = useRef(null);

    let [brush, setBrush] = useState(null)

    function onStartBrush() {
    //     let extent = d3.event.selection
    }

    function onEndBrush(coords) {
        setBrush(coords)
    }

    let [annotations, setAnnotations] = useState([])
    function onSaveAnnotation(annotation) {
        console.log(annotation)
        setAnnotations([ ...annotations, annotation])
        setBrush(null)
    }
    function onDiscardAnnotation() {
        setBrush(null)
    }

    useEffect(() => {
        console.log(d3Container)
        if(d3Container.current) {
            renderChart(d3Container.current, data, onStartBrush, onEndBrush, annotations)
        }
    }, [annotations])

    return <Box p="5">
        <Heading as="h5" size="sm">
            Diabetic annotator
        </Heading>

        <Flex>
            <Flex align="left">
                <Stack alignItems='center'>
                <div>
                    <div ref={d3Container}></div>
                </div>

                <ButtonGroup>
                    <Button>Back 6hrs</Button>
                    <Button>Forward 6hr</Button>
                </ButtonGroup>
                </Stack>
            </Flex>

            <Flex flexGrow={1} align="right" flexDirection="column" align="top">
                
                {function(){
                    if(brush == null) return <b>Drag to annotate</b>
                    else {
                        return <>
                            {/* {formatPlotlyDate(brush[0])} to {formatPlotlyDate(brush[1])} */}
                            <AnnotationInputControl 
                                startTime={brush[0]} 
                                endTime={brush[1]}
                                onSave={onSaveAnnotation}
                                onDiscard={onDiscardAnnotation}
                            />
                        </>
                    }
                }()}
                
            </Flex>
        </Flex>
    </Box>
}


import { ThemeProvider } from "@chakra-ui/core";
import { useReducer } from "react";

export default () => {
    return <ThemeProvider>
        <CSSReset />
        <Annotator />
    </ThemeProvider>
}