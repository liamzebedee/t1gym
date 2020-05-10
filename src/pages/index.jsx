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
import { Model } from '../model';


function convertFromMgToMmol(v) {
    return v / 18.
}

function formatPlotlyDate(dateObj) {
    let date, time
    let str = dateObj.toJSON().split('T')
    date = str[0]
    time = str[1].substring(0,5)
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
        let bgl = convertFromMgToMmol(record.sgv)
        const y = bgl

        return [x,y]
    })
}

function getData() {
    let observed = data
    let predicted = Model.simulate(observed)

    return {
        observed: toPlotlyFormat(observed),
        predicted: toPlotlyFormat(predicted)
    }
}


const Graph = () => {
    const { observed, predicted } = getData()
    return <>
        <Plot
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
            }} />
    </>
}

export default () => {
    return <div>
        <Graph />
    </div>
}