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

    return <Box p="5">
        <Heading as="h5" size="sm">
            Diabetic annotator
        </Heading>

        <Flex>
            <Flex align="left">
                <Stack alignItems='center'>
                <div>
                    <Chart data={data} onEndBrush={onEndBrush}/>
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
import { useLayoutEffect } from "react";
import { Chart } from "../components/Chart";

export default () => {
    return <ThemeProvider>
        <CSSReset />
        <Annotator />
    </ThemeProvider>
}