import { MINUTE, functions, compose } from "../model"

const luxon = require('luxon')

interface Event {
    type: 'food' | 'exercise' | 'insulin'
    start: number
}

import _ from 'lodash'

export function intervalSearch(intervals, x) {
    let y = _.last(intervals)
    for(let [bound, value] of intervals) {
        if(x > bound) y = value
    }
    return y
}

export function parseRatios(str) {
    return str.split('\n').filter(x => !!x).map(str => {
        let [time, value] = str.split(' ')
        // time is formatted hh.mm
        const [hh,mm] = time.split('.').map(x => parseInt(x))
        // 6.30 would be converted to 6.5
        const bound = hh + (mm / 60.)
        
        value = parseFloat(value)
        return [bound, value]
    })
}

export class InsulinPumpModel {
    bolusRatios = []
    basalRatios = []
    correctionRatios = []

    constructor(opts) {
        Object.assign(this, opts)
    }

    getBolusRatio(hour) {
        return intervalSearch(this.bolusRatios, hour)
    }

    getBasalRate(hour) {
        return intervalSearch(this.basalRatios, hour)
    }

    getCorrectionRatio(hour) {
        return intervalSearch(this.correctionRatios, hour)
    }
}

// TODO
const GLUCOSE_DESIRED_LEVEL = 6.5

// Parses event string into list of event records.
// eg. <<<
// 20/5/2020 begin
// 14.00 food 20g carbs 80
// 15.00 food 20g protein
// 16.00 insulin 12.1
// 16.00 bolus 50g
// 16.00 correct 12.5
// 17.00 exercise 30mins .8
// >>>
export function parseEvents(eventsString, insulinPumpSettings: InsulinPumpModel): Event[] {
    let referenceDate = luxon.DateTime.local()

    return eventsString.split(`\n`).map(l => l.trim()).filter(x => !!x).map(line => {
        if(line[0] == '#') return

        const parts = line.split(' ')
        
        function parseTime(time) {
            const [hour,minute] = time.split('.')
            return {
                hour, 
                minute
            }
        }
        
        const type = parts[1]
        if(type == 'begin') {
            // parse dd/mm/yyyy
            const [dd,mm,yyyy] = parts[0].split('/')
            referenceDate = referenceDate.set({
                year: yyyy,
                month: mm,
                day: dd
            })
            return
        }

        const date = referenceDate.set(parseTime(parts[0]))
        const start = date.toMillis()
        
        if(type == 'food') {
            const amount = parseFloat(parts[2].replace('g','')) // ignore g suffix
            const foodType = parts[3]
            let gi
            if(foodType == 'carbs') {
                const DEFAULT_GI = 80
                gi = parseFloat(parts[4] || DEFAULT_GI)
            }
            return {
                type,
                amount,
                start,
                foodType,
                gi
            }
        }
        if(type == 'bolus') {
            const carbAmount = parseFloat(parts[2].replace('g','')) // ignore g suffix
            // get bolus ratio
            const insulinAmount = carbAmount / insulinPumpSettings.getBolusRatio(date.c.hour)
            console.debug(start, type, carbAmount, insulinAmount)
            return {
                type: 'insulin',
                intent: 'bolus',
                start,
                amount: insulinAmount
            }
        }
        if(type == 'correct') {
            const glucoseLevel = parseFloat(parts[2])
            // get bolus ratio
            const reduceLevelBy = glucoseLevel - GLUCOSE_DESIRED_LEVEL
            const insulinAmount = reduceLevelBy / insulinPumpSettings.getCorrectionRatio(date.c.hour)
            console.debug(start, type, insulinAmount)
            return {
                type: 'insulin',
                intent: 'correct',
                start,
                amount: insulinAmount
            }
        }
        if(type == 'insulin') {
            const amount = parseFloat(parts[2])
            console.debug(start, type, amount)
            return {
                type,
                start,
                amount
            }
        }
        if(type == 'exercise') {
            const duration = parseFloat(parts[2].replace('mins','')) // ignore mins suffix
            const intensity = parseFloat(parts[3])
            console.debug(start, type, duration, intensity)
            return {
                type,
                intensity,
                start,
                duration: duration*MINUTE
            }
        }
        throw new Error(`Error parsing event - ${line}`)
    }).filter(x => !!x) // identity
}

// Converts an Event into a function that can be 
// graphed and simulated.
export function eventToFunction(event) {
    switch(event.type) {
        case 'food': {
            const { foodType, amount, gi, start } = event
            return compose(
                functions.foodDigestionEffect(
                    functions.foodDigestion(foodType, amount, gi / 100)
                ),
                functions.beginsAfter({
                    start,
                })
            )
        }
        case 'exercise': {
            const { intensity, duration, start } = event
            return compose(
                functions.exercise(intensity),
                functions.window({
                    start,
                    duration
                })
            )
        }
        case 'insulin': {
            const { amount, start } = event
            return compose(
                functions.insulinGlucoseEffect(
                    functions.fiaspInsulinActive(amount)
                ),
                functions.beginsAfter({
                    start,
                })
            )
        }
        case 'basal': {
            const { start, amount, end } = event
            return compose(
                functions.basalEffect(
                    amount
                ),
                functions.window({
                    start,
                    duration: end - start
                })
            )
        }
        default: 
            throw new Error(`Unknown event type ${event.type}`)
    }
}

import { DateTime } from 'luxon'
import { useState } from "react"

export function getStartOfDayForTime(time) {
    return DateTime.fromJSDate(new Date(time)).set({
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0
    })
}

export function usePromiseLoadingState(fn1) {
    let [loading, setLoading] = useState(null)
    async function fn() {
        setLoading(true)
        await fn1(arguments)
        setLoading(false)
    }
    return [fn, loading]
}

export function usePromiseLoadingStateWithError(fn1) {
    // This is based off the Rust Result<T> type.
    // See: https://doc.rust-lang.org/std/result/
    
    // {
    //     status: 'loading' | 'ok' | 'error',
    //     error
    // }
    let [state, setState] = useState({
        status: '',
        error: null
    })
    
    async function fn() {
        setState({
            status: 'loading',
            error: null
        })
        try {
            await fn1(arguments)
        } catch(error) {
            setState({
                status: 'error',
                error
            })
            return
        }
        setState({
            status: 'ok',
            error: null
        })
    }
    return [fn, state]
}

export function convertFromMgToMmol(v) {
    return v / 18.
}

// Convert American glucose units.
export function convertData(d) {
    return d
        .map(d => {
            return {
                ...d,
                date: d.date,
                sgv: convertFromMgToMmol(d.sgv)
            }
        })
        .reverse()
}

export default () => null