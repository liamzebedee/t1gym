import { Box, Flex, Stack, Heading, Text } from "@chakra-ui/core";
import { useRef, useState } from 'react';
import * as _ from 'lodash'
import { DateTime } from 'luxon'
import DatabaseService from '../../misc/db_service';
import { getStartOfDayForTime } from '../../pages/helpers';
import { AnnotationInputControl } from '../AnnotationInputControl';
import { Chart } from "../Chart";


const Annotation = ({ startTime, endTime, tags }) => {
    const start = DateTime.fromJSDate(startTime)

    return <Text mt={4}>
        {start.toFormat('t')} {tags.join(',')}
    </Text>
}

export const Annotator = (props) => {
    const { data, onAnnotation } = props

    const d3Container = useRef(null);

    let [brush, setBrush] = useState(null)

    function onStartBrush() {
    //     let extent = d3.event.selection
    }
    function onEndBrush(coords) {
        setBrush(coords)
    }

    let [annotations, setAnnotations] = useState(props.annotations || [])
    async function onSaveAnnotation(annotation) {
        console.log(annotation)

        await props.onSaveAnnotation(annotation)

        setAnnotations([ ...annotations, annotation])
        setBrush(null)
    }
    function onDiscardAnnotation() {
        setBrush(null)
    }

    const day = getStartOfDayForTime(data[0].date)

    return <Box p={5}>
        <Flex>
            <Flex align="left">
                <Stack alignItems='center'>
                    <Chart data={data} onEndBrush={onEndBrush}/>
                </Stack>
            </Flex>

            <Flex flexGrow={1} align="right" flexDirection="column" align="top">
                <Stack spacing={8}>
                    <Box p={5} shadow="sm" borderWidth="1px">
                        <Heading fontSize="xl">
                            {day.toFormat('DDD')}
                        </Heading>
                        
                        { _.sortBy(annotations, ['startTime']).map((x, i) => <Annotation {...x} key={i}/>) }
                    </Box>
                    
                    <Box p={5} shadow="xs" borderWidth="1px">
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
                    </Box>
                </Stack>
            </Flex>
        </Flex>
    </Box>
}
