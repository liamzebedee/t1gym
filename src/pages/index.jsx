// import Plot from 'react-plotly.js';
// const Plot = require('react-plotly.js')
import { useEffect, useState, Component } from 'react';
import ReactDOM from 'react-dom'

import dynamic from 'next/dynamic';

const Plot = dynamic(
    () => import('react-plotly.js'),
    {
        ssr: false
    }
)


import data from '../../data/glucose.json'
import { functions, Model, exerciseEffect, MINUTE, HOUR, compose } from '../model';


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

import chrono from 'chrono-node'
console.log(
    chrono.parseDate('today')
)

function getData() {
    let observed = convertData(data)
    let predicted = Model.simulate(observed)

    return {
        observed: toPlotlyFormat(observed),
        predicted: toPlotlyFormat(predicted)
    }
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

const Graph = () => {
    const [annotations, setAnnotations] = useState([])

    const { observed, predicted } = getData()
    return <>
        <Plot
            // onClick={(ev) => {
            //     const { points } = ev
            //     // Get the clicked point on the "real" line.
            //     const {x,y} = points.filter(x => x.data.name == 'real')[0]
            //     // console.l9g
            //     setAnnotations(annotations.concat({
            //         x,y
            //     }))
            // }}
            onSelected={ev => {
                const { range } = ev 
                const [from, to] = range.x
                
            }}
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

export default () => {
    return <div>
        <Graph />
    </div>
}