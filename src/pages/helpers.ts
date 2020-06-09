import { MINUTE, functions, compose } from "../model"
import IntervalTree from 'node-interval-tree'


const luxon = require('luxon')

interface Event {
    type: 'food' | 'exercise' | 'insulin' | 'bolus' | 'correction'
    start: number
}

import _ from 'lodash'

function intervalSearch(intervals, x) {
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
// 2pm food 20g carbs 80
// 3pm food 20g protein
// 4pm insulin 12.1
// 4pm bolus 50g
// 4pm correction 12.5
// 5pm exercise 30mins .8
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