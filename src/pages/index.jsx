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
import { functions, Model, exerciseEffect, MINUTE, HOUR, compose, parseEvents } from '../model';
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



function getData(data, fromTo, events) {
    // Convert data from raw NightScout JSON.
    let observed = convertData(data)

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
    let predicted = Model.simulate(observed1, 3.5*HOUR, events)

    // Convert to Plotly format.
    return {
        observed: toPlotlyFormat(observed),
        predicted: toPlotlyFormat(predicted)
    }
}

import { Textarea } from "@chakra-ui/core";
import { Select, Button } from "@chakra-ui/core";


const Graph = () => {
    const [annotations, setAnnotations] = useState([])
    const [fromTo, setFromTo] = useState([])

    // ew gross
    const [observed, setObserved] = useState([])
    const [predicted, setPredicted] = useState([])
    const [eventsText, setEventsText] = useState(
`20/05/2020 begin
10.55 food 60g carbs 80
11.24 insulin 5
12.31 insulin 5.6
13.12 insulin 1
15.28 insulin 3.5
15.36 insulin 2
15.49 insulin 1.5
15.49 food 15g carbs 60
18.05 food 35g carbs 90`)

    useEffect(() => {
        loadExperiments()

        let events
        try {
            events = parseEvents(eventsText)
        } catch(ex) {
            // didn't validate
            return
        }

        const { observed, predicted } = getData(latestGlucoseFeed, fromTo, events)
        setObserved(observed)
        setPredicted(predicted)
    }, [fromTo, eventsText])

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
            observed, eventsText, fromTo
        }
        const experiments1 = [...experiments, experiment]
        
        setExperiments(experiments1)
        localStorage.setItem('experiments', JSON.stringify(experiments1))
    }

    function loadExperiments() {
        let d = localStorage.getItem('experiments') || ''
        setExperiments(
            JSON.parse(d)
        )
    }

    function loadExperiment(i) {
        if(!i) {
            setObserved(latestGlucoseFeed)
            setEventsText('')
            setFromTo([])
            return
        } // The <select> title was clicked.

        let { observed, eventsText, fromTo } = experiments[i]
        setObserved(observed)
        setEventsText(eventsText)
        setFromTo(fromTo)
    }

    return <>
        <div>
            <label>Time filter: { fromTo.length == 2 ? 'set' : 'unset' }</label>
            <Button onClick={clearTimeFilter}>Clear</Button>
        </div>

        <div>
            <label>Events</label>

            <Textarea
                value={eventsText}
                onChange={e => setEventsText(e.target.value)}
                placeholder="Here is a sample placeholder"
                size="md"
            />
        </div>


        <Button variantColor="green" onClick={saveExperiment}>Save experiment</Button>

        <Select placeholder="Choose experiment..." onChange={ev => loadExperiment(ev.target.value)}>
            {
                experiments.map((experiment, i) => {
                    return <option value={`${i}`}>Experiment {i}</option>
                })
            }
        </Select>

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
                },
                yaxis: {range: [1, 20]},
                annotations,
            }} />
        
        <FunctionPlot title="Testing" id='testing' fn={
            compose(
                functions.exercise(0.8),
                functions.window({
                    start: 50*MINUTE,
                    duration: 20*MINUTE
                })
            )
        } duration={2*HOUR}/>

        <FunctionPlot title="Exercise" id='exercise' fn={functions.exercise(1)} duration={2*HOUR}/>
        <FunctionPlot title="Fiasp insulin active" id='insulin' fn={functions.fiaspInsulinActive(1)} duration={7*HOUR}/>
        <FunctionPlot title="Food digestion (30g - Carbs)" id='insulin' fn={functions.foodDigestion('carbs', 15, 0.8)} duration={7*HOUR}/>
        <FunctionPlot title="Food digestion (30g - Protein)" id='insulin' fn={functions.foodDigestion('protein', 30)} duration={7*HOUR}/>
    </>
}

import { ThemeProvider } from "@chakra-ui/core";

export default () => {
    return <ThemeProvider>
        <Graph />
    </ThemeProvider>
}