import { Box, Flex, Stack, Heading, Text, Tag, TagLabel, Icon, IconButton, Button, ButtonGroup } from "@chakra-ui/core";
import { useRef, useState, useContext } from 'react';
import * as _ from 'lodash'
import { DateTime } from 'luxon'
import { getStartOfDayForTime } from '../../pages/helpers';
import { NewAnnotationControl } from '../NewAnnotationControl';
import { Chart } from "../Chart";
import styles from './styles.module.css'
import { Table, TableRow, TableCell, TableHead, TableHeader, TableBody } from "../Table";
import { useHoverPickSelector } from "../../misc/hooks";
import { getBasalSeries } from "../../misc/basals";
import * as d3 from "d3"
import { NightscoutProfilesContext } from "../../misc/contexts";
import { MINUTE } from "../../model";



function isCarbTreatment(treatment) {
    return treatment.eventType == 'Meal Bolus'
}
function isInsulinTreatment(treatment) {
    return (treatment.eventType == 'Meal Bolus' && treatment.insulin != null)
        || treatment.eventType == 'Correction Bolus'
}

export const LogbookEntry = (props) => {
    const { data, treatments, onAnnotation } = props
    const extent = d3.extent(data, function (d) { return d.date })
    const profiles = useContext(NightscoutProfilesContext)
    const basalSeries = getBasalSeries(profiles, treatments.filter(event => event.eventType == 'Temp Basal'), extent[0], extent[1])

    const d3Container = useRef(null);

    const [brush, setBrush] = useState(null)
    const [stats, setStats] = useState({
        startBG: null,
        endBG: null,
        deltaBG: null
    })

    function onStartBrush() {
    //     let extent = d3.event.selection
    }
    function onEndBrush(coords) {
        onSelectAnnotation(null)
        if(!coords) {
            setBrush(null)
            return
        }
        
        const [startTime, endTime] = _.orderBy(coords, 'asc')

        // Get glucose range and calculate stats.
        // TODO: document assumptions of data's ordering.
        const annotationData = _.sortBy(
            data.filter(d => {
                return (d.date >= startTime) && (d.date <= endTime)
            }),
            'date'
        )

        if(annotationData.length) {
            // TODO(liamz): I don't exactly know what's going on here.
            
            // BG stats.
            const startBG = annotationData[0].sgv
            const endBG = _.last(annotationData).sgv
            const deltaBG = endBG - startBG

            // Insulin/carb stats.
            const treatmentsWithinRange = treatments.filter(d => {
                // TODO: Treatments use the `timestamp` field, but we use Unix timestamps throughout
                // the codebase. Would be wise to be consistent.
                const date = +new Date(d.created_at)
                return (date >= startTime) && (date <= endTime)
            })
            const totalCarbs = treatmentsWithinRange
                .filter(isCarbTreatment)
                .reduce((prev, curr) => prev + curr.carbs, 0)
            const totalInsulin = treatmentsWithinRange
                .filter(isInsulinTreatment)
                .reduce((prev, curr) => prev + curr.insulin, 0)
            
            const filteredBasalSeries = basalSeries.filter(x => x.startTime >= startTime && x.startTime <= endTime)
            const totalBasalInsulin = filteredBasalSeries.reduce((prev, curr) => {
                // TODO: assuming here that the basal series is spaced apart in 5 minute intervals.
                const delivered = curr.rate / (60 / 5)
                return prev + delivered
            }, 0)

            setStats({
                startBG,
                endBG,
                deltaBG,
                totalCarbs,
                totalInsulin,
                totalBasalInsulin
            })
        }


        setBrush(coords)
    }

    let [annotations, setAnnotations] = useState(props.annotations || [])
    async function onSaveAnnotation(annotation) {
        await props.onSaveAnnotation(annotation)

        setAnnotations([ ...annotations, annotation ])
        setBrush(null)
    }
    function onDiscardAnnotation() {
        setBrush(null)
    }

    const [previewedAnnotation, selectedAnnotation, hoveredAnnotation, onHoverAnnotation, onSelectAnnotation] = useHoverPickSelector()

    const day = getStartOfDayForTime(data[0].date)

    function handleDownloadCsv(el) {
        // Generate the CSV's filename and content.
        // The filename is in the form: bgls_dd-mm-yyyy.csv
        // The content is a table of two columns, Time and BGL.
        const day = DateTime.fromMillis(extent[0])
        const csvFilename = `bgls_${day.toFormat('dd-MM-yyyy')}.csv` // bgls_dd-mm-yyyy.csv
        let csvContent = ""
        csvContent += `Time,BGL\n`

        const dataSorted = _.sortBy(data, 'date')
        for(let row of dataSorted) {
            const time = DateTime.fromMillis(row.date).toFormat('t') // hh:mm
            const bgl = row.sgv.toFixed(1)
            csvContent += `${time},${bgl}\n`
        }

        // To download a file, we use the HTML5 Blob [1] and Object URL [2] API's.
        //  1. A blob is created from a string, which is then used to generate an
        //     object URL.
        //  2. An anonymous <a> element is generated.
        //  3. We set the a.href to an object URL, and click it to start the download.
        // 
        // [1] Blob: https://developer.mozilla.org/en-US/docs/Web/API/Blob
        // [2] createObjectURL: https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const downloadLink = document.createElement("a")
        const url = URL.createObjectURL(blob)
        downloadLink.id = "download"
        downloadLink.download = csvFilename
        downloadLink.href = url
        downloadLink.click()
        // window.URL.revokeObjectURL(url);
        // We don't call revokeObjectURL, as there are some cross-browser incompatibilities
        // that I don't care to fix right now. 
        // See: https://stackoverflow.com/a/48968694/453438
    }

    return <Box pb={10} pt={10} borderWidth="1px" shadow="xs">
        <Flex flexDirection="row">
            <Flex flex="4" align="top" justify="center" justifyItems="center" pl={10} pr={10}>
                <Stack flexGrow={1} spacing={8}>
                    <Box>
                        <Heading fontSize="xl" mb={5}>
                            {day.toFormat('ccc DDD')}
                        </Heading>

                        <Box pb={5}>
                        <Button
                            variant="outline"
                            onClick={handleDownloadCsv}
                            aria-label="Download CSV"
                            icon="download">
                                <Icon name='download'></Icon>Download CSV
                        </Button>
                        </Box>

                        <AnnotationsTable {...{ annotations, onSelectAnnotation, onHoverAnnotation, selectedAnnotation,  }}/>
                    </Box>
                    
                    <Box p={2} shadow="xs" borderWidth="1px">
                        {function(){
                            if(brush == null) return <b>Highlight your chart to add notes</b>
                            else {
                                return <>
                                    <Heading as="h3" size="md" pb={2}>
                                        New annotation
                                    </Heading>

                                    <NewAnnotationControl 
                                        stats={stats}
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

            <Flex flex="6" align="start" justify="start" flexDirection='column' mr={5}>
                <Chart 
                    data={data} 
                    basalSeries={basalSeries}
                    onEndBrush={onEndBrush}
                    annotations={(previewedAnnotation != null) && [ _.find(annotations, { id: previewedAnnotation }) ]}
                    events={treatments}
                    showTempBasalChart={true}
                    />
            </Flex>
        </Flex>
    </Box>
}


const AnnotationsTable = ({ annotations, onSelectAnnotation, onHoverAnnotation, selectedAnnotation }) => {
    return <Table>
        <TableHead>
            <TableRow>
                <TableHeader width={80}>Time</TableHeader>
                <TableHeader width={80}>Tags</TableHeader>
                <TableHeader>Notes</TableHeader>
            </TableRow>
        </TableHead>
        <TableBody>
        {
            _.sortBy(annotations, ['startTime'])
            .map((x, i) => <TableRow 
                key={x.id} 
                bg={i % 2 == 0 ? 'white' : 'gray.50'} 
                className={`${styles.annotation} ${selectedAnnotation === x.id && styles.active}`}
                onClick={() => onSelectAnnotation(x.id)}
                onMouseEnter={() => onHoverAnnotation(x.id)}
                onMouseLeave={() => onHoverAnnotation(null)}>
                <AnnotationTableRow {...x} active={selectedAnnotation === x.id}/>
            </TableRow>) 
        }
        </TableBody>
    </Table>
}

const AnnotationTableRow = ({ startTime, endTime, tags, notes, active }) => {
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