import { Box, Flex, Stack, Heading, Text, Tag, TagLabel } from "@chakra-ui/core";
import { useRef, useState } from 'react';
import * as _ from 'lodash'
import { DateTime } from 'luxon'
import DatabaseService from '../../misc/db_service';
import { getStartOfDayForTime } from '../../pages/helpers';
import { AnnotationInputControl } from '../AnnotationInputControl';
import { Chart } from "../Chart";
import styles from './styles.module.css'
import { Table, TableRow, TableCell, TableHead, TableHeader, TableBody } from "../Table";
import { useHoverPickSelector } from "../../misc/hooks";

const Annotation = ({ startTime, endTime, tags, notes, active }) => {
    const start = DateTime.fromJSDate(startTime)
    return <>
    <TableCell>
     <Text>
        { active 
        ? <b>{ start.toFormat('t') }</b> 
        : start.toFormat('t') 
        }
        
    </Text>
    </TableCell>
    <TableCell>
        { tags.join(', ') }
        {/* <Stack spacing={1} isInline>
            {tags.length && tags.map(tag => <Tag
                size={'sm'}
                rounded="full"
                variant="solid"
            >
                <TagLabel>{tag}</TagLabel>
            </Tag>)}
        </Stack> */}
    </TableCell>
    <TableCell>
        <p style={{ whiteSpace: 'pre-wrap' }}>
            {notes}
        </p>
    </TableCell>
    </>
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

    const [previewedAnnotation, selectedAnnotation, hoveredAnnotation, onHoverAnnotation, onSelectAnnotation] = useHoverPickSelector()

    const day = getStartOfDayForTime(data[0].date)

    return <Box p={5}>
        <Flex>
            <Flex align="left">
                <Stack alignItems='center'>
                    <Chart 
                        data={data} 
                        onEndBrush={onEndBrush}
                        annotations={(previewedAnnotation != null) && [ annotations[previewedAnnotation] ]}
                        />
                </Stack>
            </Flex>

            <Flex flexGrow={1} align="right" flexDirection="column" align="top">
                <Stack spacing={8}>
                    <Box p={5} shadow="sm" borderWidth="1px">
                        <Heading fontSize="xl" mb={5}>
                            {day.toFormat('DDD')}
                        </Heading>
                        
                        
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableHeader><strong>{annotations.length} annotations</strong></TableHeader>
                                    <TableHeader>Tags</TableHeader>
                                    <TableHeader>Notes</TableHeader>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                            {
                                _.sortBy(annotations, ['startTime'])
                                .map((x, i) => <TableRow bg={i % 2 == 0 ? 'white' : 'gray.50'} className={`${styles.annotation} ${selectedAnnotation === i && styles.active}`}  
                                    onClick={() => onSelectAnnotation(i)}
                                    onMouseEnter={() => onHoverAnnotation(i)}
                                    onMouseLeave={() => onHoverAnnotation(null)}>
                                    <Annotation {...x} key={i} active={selectedAnnotation === i}/>
                                </TableRow>) 
                            }
                            </TableBody>
                        </Table>
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
