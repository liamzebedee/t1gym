// Show data on plot.
// [x] Show a plot line.
// [x] Show axes.
// [x] Select from day by day of data.
// [x] Drag to select range.
// [] Save annotations to database
// [-] Grab and move graph.
// [x] Navigate between days in nightscout.

import { convertData, formatPlotlyDate } from './experiment'
import * as d3 from "d3";
import { useEffect, useRef, useState } from 'react';


import { ThemeProvider, CSSReset } from "@chakra-ui/core";
import { useReducer } from "react";
import { useLayoutEffect } from "react";
import { Chart } from "../components/Chart";

import { Annotator } from './annotate'
import * as luxon from 'luxon'
import { Duration, DateTime } from 'luxon'

const Dashboard = () => {
    const [bgs, setBgs] = useState(null)

    async function getBGData() {
        const data = await fetch('/api/bgs').then(res => res.json())
        setBgs(data)
    }

    useEffect(() => {
        getBGData()
    }, [])

    return <>
        {/* <Annotator /> */}
        {bgs && bgs.map(bgset => {
            return <Chart data={convertData(bgset.data)}/>
        })}
    </>
}

export default () => {
    return <ThemeProvider>
        <CSSReset />
        <Dashboard/>
    </ThemeProvider>
}