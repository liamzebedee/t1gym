// import Plot from 'react-plotly.js';
// const Plot = require('react-plotly.js')
import { useEffect, useState, Component, useReducer } from 'react';
import ReactDOM from 'react-dom'

import dynamic from 'next/dynamic';

// Make Plotly work with Next.js.
const Plot = dynamic(
    () => import('react-plotly.js'),
    {
        ssr: false
    }
)

import latestGlucoseFeed from '../../data/glucose.json'
import { functions, Model, exerciseEffect, MINUTE, HOUR, compose, parseEvents, BodyMetabolismModel, SECOND } from '../model';
import _ from 'lodash'
import chrono from 'chrono-node'

function convertFromMgToMmol(v) {
    return v / 18.
}

function formatPlotlyDate(dateObj) {
    let date, time
    let str = dateObj.toLocaleString().split(', ')
    // 2020-05-13 22:14
    date = str[0].split('/').reverse().join('-')
    time = str[1].substring(0,5)
    // console.log(date, time)
    return `${date} ${time}`
}

function toPlotlyFormat(data) {
    // convert glucose data to x,y
    return data.map((record, i) => {
        // x
        let date = new Date(record.date)
        // const x = i
        const x = formatPlotlyDate(date)

        // y
        const y = record.sgv

        return [x,y]
    })
}

// Convert American glucose units.
function convertData(d) {
    return d
        .map(d => {
            return {
                ...d,
                date: d.date + 10*SECOND,
                sgv: convertFromMgToMmol(d.sgv)
            }
        })
        .reverse()
}


let experiments = []

const FunctionPlot = ({ fn, duration, id, title }) => {
    const STEP = 1*MINUTE
    
    let xv = []
    let yv = []
    for(let x = 0; x < duration; x += STEP) {
        // normalise x axis to showing minutes
        xv.push(x/HOUR)
        yv.push(fn(x))
    }

    return <>
        <Plot
            layout={{
                title
            }}
            data={[
                {
                    x: xv,
                    y: yv,
                    type: 'scatter',
                    name: `fnplot-${id}`,
                    mode: 'lines',
                    marker: { color: 'black' },
                },
            ]}
        />
    </>
}



function getData(glucoseFeed, fromTo, events, model) {
    // Convert data from raw NightScout JSON.
    let observed = convertData(glucoseFeed)

    let observed1 = observed
    
    // Filter between fromTo, if it's configured. 
    if(fromTo.length == 2) {
        let [from,to] = fromTo
        console.debug(`from=${from} to=${to}`)
        observed1 = observed.filter(entry => {
            return (entry.date >= from) && (entry.date <= to)
        })
    }

    // Run simulation.
    let predicted = Model.simulate(observed1,1*HOUR, events, model)

    // Convert to Plotly format.
    return {
        observed: toPlotlyFormat(observed),
        predicted: toPlotlyFormat(predicted)
    }
}

import { Textarea, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, NumberInput, Stack, FormControl, FormLabel, CSSReset, Heading, Box, Flex } from "@chakra-ui/core";
import { Select, Button } from "@chakra-ui/core";
// import * from '@chakra-ui/core'


const Graph = () => {
    const [annotations, setAnnotations] = useState([])
    const [fromTo, setFromTo] = useState([])

    // ew gross
    const [glucoseFeed, setGlucoseFeed] = useState(latestGlucoseFeed)
    const [observed, setObserved] = useState([])
    const [predicted, setPredicted] = useState([])
    const [eventsText, setEventsText] = useState('')
    const [model, setModel] = useState({
        insulinSensitivity: -2.0,
        carbSensitivity: 2.9,
        insulinActive: 1.0
    })

    useEffect(() => {
        loadExperiments()

        let events
        try {
            // Output some stats.
            events = parseEvents(eventsText)
            console.log(events.filter(x => x.type == 'insulin'))
            const totalInsulin = events.filter(x => x.type == 'insulin').reduce((prev, curr) => {
                return prev + curr.amount
            }, 0)
            const totalCarbs = events.filter(x => x.type == 'food').reduce((prev, curr) => {
                return prev + curr.amount
            }, 0)
            console.log(`Total insulin:`, totalInsulin, 'U')
            console.log(`Total carbs:`, totalCarbs, 'g')
        } catch(ex) {
            console.log(ex)
            // didn't validate
            return
        }

        const { observed, predicted } = getData(
            glucoseFeed, fromTo, events,
            new BodyMetabolismModel(model)
        )
        setObserved(observed)
        setPredicted(predicted)
    }, [glucoseFeed, fromTo, eventsText, model])

    function clearTimeFilter() {
        setFromTo([])
    }

    const [experiments, setExperiments] = useState([])
    
    function saveExperiment() {
        // Save the experiment for later viewing.
        // - observed data
        // - events
        // - fromTo

        const experiment = {
            glucoseFeed, observed, eventsText, fromTo
        }
        const experiments1 = [...experiments, experiment]
        
        setExperiments(experiments1)
        localStorage.setItem('experiments', JSON.stringify(experiments1))
    }

    function loadExperiments() {
        let d = localStorage.getItem('experiments') || '[]'
        let d2 = JSON.parse(d)
        setExperiments(
            d2
        )
    }

    function loadExperiment(i) {
        if(!i) {
            setGlucoseFeed(latestGlucoseFeed)
            setObserved([])
            setEventsText('')
            setFromTo([])
            return
        } // The <select> title was clicked.

        let { glucoseFeed, observed, eventsText, fromTo } = experiments[i]
        // setGlucoseFeed(glucoseFeed)
        setObserved(observed)
        setEventsText(eventsText)
        setFromTo(fromTo)
    }

    return <Box p="5">
        <Flex align="center">
            <Heading as="h5" size="sm">
                Experiments
            </Heading>
            <Stack shouldWrapChildren isInline>
                <Select size="sm" placeholder="Choose experiment..." onChange={ev => loadExperiment(ev.target.value)}>
                    {
                        experiments.map((experiment, i) => {
                            return <option value={`${i}`}>Experiment {i}</option>
                        })
                    }
                </Select>
                <Button size="sm" variantColor="green" onClick={saveExperiment}>Save</Button>
            </Stack>
        </Flex>

        <Flex align="center">
            <Flex align="left">
            <Plot
                onClick={(ev) => {
                    const { points } = ev
                    // Get the clicked point on the line.
                    const { x,y } = points[0]

                    const fromToStack = fromTo.slice() // clone
                    fromToStack.push((new Date(x)).getTime()) // x is time
                    
                    const recent = fromToStack.slice(-2)
                    
                    setFromTo(_.sortBy(recent)) // use only recent two items

                    setAnnotations(annotations.concat({
                        x,y
                    }))
                }}
                // onSelected={ev => {
                //     const { range } = ev 
                //     const [from, to] = range.x
                //     setFromTo([from, to])
                // }}
                data={[
                    {
                        x: observed.map(a => a[0]),
                        y: observed.map(a => a[1]),
                        type: 'scatter',
                        name: 'real',
                        mode: 'lines+markers',
                        marker: { color: 'black' },
                    },
                    {
                        x: predicted.map(a => a[0]),
                        y: predicted.map(a => a[1]),
                        name: 'predicted',
                        type: 'scatter',
                        mode: 'lines',
                        marker: { color: 'blue' },
                    }
                ]}
                layout={{ 
                    width: 1024, 
                    height: 720, 
                    title: 'Blood glucose',
                    xaxis: {
                        autorange: true,
                        title: 'Time'
                    },
                    yaxis: {
                        range: [1, 20],
                        title: 'BGL'
                    },
                    annotations,
                }} 
            />
            </Flex>
            <Flex align="right" flexDirection="column" align="top">
                <Heading as="h5" size="md">
                    Model
                </Heading>
                
                <FormControl>
                    <FormLabel htmlFor="events">Events</FormLabel>
                    <Textarea
                        height={275}
                        id='events'
                        value={eventsText}
                        onChange={e => setEventsText(e.target.value)}
                        placeholder="Here is a sample placeholder"
                        size="md"
                    />
                </FormControl>
                
                <div>
                    
                    <label><strong>Time filter</strong>: { fromTo.length == 2 ? 'set' : 'unset' }</label>
                    <Button size="sm" onClick={clearTimeFilter}>Clear</Button>
                </div>

                <Stack shouldWrapChildren isInline>
                    <FormControl>
                        <FormLabel htmlFor="carb-sensitivity">🍎 Carb. sensitivity (10g : x mmol)</FormLabel>
                        <NumberInput 
                            id="carb-sensitivity" size="sm" defaultValue={model.carbSensitivity} precision={1} step={0.1} 
                            onChange={v => {
                                setModel({ ...model, carbSensitivity: parseFloat(v) })
                            }}>
                            <NumberInputField />
                            <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                    </FormControl>

                    <FormControl>
                        <FormLabel htmlFor="carb-sensitivity">💉 Insulin sensitivity (1U : x mmol)</FormLabel>
                        <NumberInput size="sm" defaultValue={model.insulinSensitivity} precision={1} min={-10} step={0.1} max={0}
                            onChange={v => {
                                setModel({ ...model, insulinSensitivity: parseFloat(v) })
                            }}>
                            <NumberInputField />
                            <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                        <div>
                            (1U : {(model.carbSensitivity / -1 * model.insulinSensitivity).toFixed(1)}g)
                        </div>
                    </FormControl>

                    <FormControl>
                        <FormLabel htmlFor="carb-sensitivity">💉⏱ Insulin active</FormLabel>
                        <NumberInput size="sm" defaultValue={model.insulinActive} precision={1} min={0} step={0.1}
                            onChange={v => {
                                setModel({ ...model, insulinActive: parseFloat(v) })
                            }}>
                            <NumberInputField />
                            <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                    </FormControl>
                </Stack>
            </Flex>
        </Flex>
        
        <FunctionPlots/>
    </Box>
}

const testing = compose(
    functions.foodDigestionEffect(
        functions.foodDigestion('carbs', 40, 51 / 100)
    ),
    functions.beginsAfter({
        start: 0,
    })
)

const exerciseFn = functions.exercise(1)
const insulinActive = functions.fiaspInsulinActive(1)
const foodDigestionCarbs = functions.foodDigestion('carbs', 30, 0.5)
const foodDigestionProtein = functions.foodDigestion('protein', 30)
const basal = functions.basalEffect(0.7)

const FunctionPlots = () => {
    return <>
        <FunctionPlot title="Testing" id='testing' fn={testing} duration={6*HOUR}/>
        <FunctionPlot title="Exercise" id='exercise' fn={exerciseFn} duration={2*HOUR}/>
        <FunctionPlot title="Fiasp insulin active" id='insulin' fn={insulinActive} duration={7*HOUR}/>
        <FunctionPlot title="Food digestion (30g - Carbs)" id='insulin' fn={foodDigestionCarbs} duration={7*HOUR}/>
        <FunctionPlot title="Food digestion (30g - Protein)" id='insulin' fn={foodDigestionProtein} duration={7*HOUR}/>
        <FunctionPlot title="Basal rate" id='basal' fn={basal} duration={5*HOUR}/>
    </>
}

import { ThemeProvider } from "@chakra-ui/core";

export default () => {
    return <ThemeProvider>
        <CSSReset/>
        <Graph />
    </ThemeProvider>
}