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

function getData() {
    // convert glucose data to x,y
    const observed = data.map((record, i) => {
        // x
        let date = new Date(record.date)
        // const x = i
        const x = formatPlotlyDate(date)

        // y
        let bgl = convertFromMgToMmol(record.sgv)
        const y = bgl

        return [x,y]
    })

    const predicted = observed.map(record => {
        return [
            record[0],
            record[1] + Math.random()
        ]
    })

    return {
        observed,
        predicted
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
            layout={{ width: 1024, height: 720, title: 'Blood glucose' }} />
    </>
}

export default () => {
    return <div>
        <Graph />
    </div>
}