
const _ = require('lodash')
const {step, linear} = require('everpolate')

type GlucoseFeed = BGLMeasurement[]

// in ms
type Duration = number

interface BGLMeasurement {
    sgv: number
    date: number // timestamp
}


/**
 * step(t: time, sgv: number, duration) -> t + duration, sgv'
 */

// Common time units in ms.
export const SECOND = 1000
export const MINUTE = 60 * SECOND
export const HOUR = 60 * MINUTE

function BackgroundGlucoseEffect({ sgv, date, duration }) {
    const BACKGROUND_RELEASE_MMOL_PER_HOUR = 1.0
    const d = [60 * MINUTE, BACKGROUND_RELEASE_MMOL_PER_HOUR]
    return (duration / d[0]) * d[1]
}


export class BodyMetabolismModel {
    // insulinSensitivity = -2
    // carbSensitivity = 4.5 / 15
    // insulinActive
    public insulinSensitivity
    public carbSensitivity
    public insulinActive

    constructor(opts) {
        Object.assign(this, opts)
    }

    // Insulin sensitivity is the ratio of 1 insulin unit : x mmol blood glucose reduction.
    getInsulinSensitivity(): number {
        // return -2.2
        return this.insulinSensitivity
    }

    // 10g of carbs raises x mmol
    getCarbSensitivty(): number {
        // 15g carb raises BGL by 3mmol
        // 15/3
        // return .2 * 1.5
        // bolus ratio
        // 8g : 1U
        // 8g = 1U

        // return -1 * this.getInsulinSensitivity() / 8
        // const carbs = 15
        // const mmol = 4.5
        // return mmol / carbs

        return this.carbSensitivity / 10.
    }

    // Gets
    getInsulinActive(): number {
        return this.insulinActive
    }
}

let metabolism = new BodyMetabolismModel({
    insulinSensitivity: -2.0,
    carbSensitivity: 2.9,
    insulinActive: 1.0
})

// Fiasp insulin model.
// HOUR IOB
export let fiaspInsulinModel = `
0	0
0.5	41
1	55
1.5	69
2	78
2.5	83
3	88
3.5	90
4	95
4.5	97
5	100
`.split('\n').filter(x => !!x).map(line => line.match(/\S+/g).map(x => parseFloat(x)))
// console.log('fiasp', fiaspInsulinModel)

type MealType = 'protein' | 'carbs'
interface FoodEffect {
    mealType: MealType
    amount: number
    glycemicIndex: number
}

const ExerciseIntensity = {
    Cardio: 0.8,
    Core: 0.4,
}

const BURN_RATE = (-6 / (60*MINUTE))

/**
 * An example of how to use/compose these functions:
 * 
    compose(
        functions.exercise(0.8),
        functions.window({
            start: startDate + (20 * MINUTE),
            duration: 50*MINUTE
        })
    ),

    // Mock dumplings.
    // nom nom nom.
    compose(
        functions.foodDigestionEffect(
            functions.foodDigestion('carbs', 80, 63 / 100)
        ),
        functions.beginsAfter({
            start: startDate,
        })
    ),

    compose(
        functions.insulinGlucoseEffect(
            functions.fiaspInsulinActive(12)
        ),
        functions.beginsAfter({
            start: startDate + 20 * MINUTE,
        })
    )
 */
export const functions = {
    exercise(intensity) {
        return u => 
            (intensity) * (u*BURN_RATE)
    },

    // Insulin active
    // Returns insulin active at t hours, capping at amount when all insulin is released.
    fiaspInsulinActive(amount) {
        return u => {
            // scale u by slowness
            // const u1 = u / 1.5
            const u1 = u * metabolism.getInsulinActive()
            const y = linear(
                [u1 / HOUR],
                fiaspInsulinModel.map(a => a[0]),
                fiaspInsulinModel.map(a => a[1])
            )
            const delivered = (y[0] / 100) * amount
            // console.log(`amount:${amount}`, `delivered:${Math.min(delivered, amount)}`, `hours:${u / HOUR}`)
            return Math.min(delivered, amount)
        }
    },

    insulinGlucoseEffect(insulinActive) {
        return (u) => {
            return insulinActive(u) * metabolism.getInsulinSensitivity()
        }
    },

    foodDigestion(type, amount, glycemicIndex) {
        let amount2 = amount
        if(type == 'protein') {
            amount2 /= 5
            const PROTEIN_DEFAULT_GI = 0.4
            if(!glycemicIndex) glycemicIndex = PROTEIN_DEFAULT_GI
        }

        return u => {
            // linear release

            // say release time is 5% every 10 mins
            // 10/5 is per ms.

            // 6*HOUR : GI 1.
            // 
            const duration = (1-glycemicIndex) * 6*HOUR
            return amount2 * Math.min(u, duration) / duration
        }
    },

    foodDigestionEffect(foodDigestion) {
        return (u) => {
            // console.log(u, b, c, insulinActive(u), metabolism.getInsulinSensitivity())
            return foodDigestion(u) * metabolism.getCarbSensitivty()
        }
    },


    // A window of time.
    // 0 until `start`, then returns elapsed mS up until a max of `duration`
    window({ start, duration }) {
        const elapsed = t => t - start
        return (t) => {
            if(t < start) return 0
            return Math.min(elapsed(t), duration) * 1.
        }
    },

    beginsAfter({ start }) {
        const elapsed = t => t - start
        return (t) => {
            if(t < start) return 0
            return elapsed(t)
        }
    },

    // We model basal as a simple incremental release of the basal `amount`
    // every minute.
    basalEffect(rate) {
        return u => {
            let g = 0
            for(let i = 0; i < u; i += MINUTE) {
                // Divide rate per minute.
                g += functions.insulinGlucoseEffect(functions.fiaspInsulinActive(rate / 60))(u + i)
            }
            return g
        }
    }
}


// Functional enhancer.
export const compose = (...fns) =>
    fns.reduceRight((prevFn, nextFn) =>
        (...args) => nextFn(prevFn(...args)),
        value => value
    )
;


const chrono = require('chrono-node')
const luxon = require('luxon')

interface Event {
    type: 'food' | 'exercise' | 'insulin'
    start: number
}

// Parses event string into list of event records.
// eg. <<<
// 20/5/2020 begin
// 2pm food 20g carbs 80
// 3pm food 20g protein
// 4pm insulin 12.1
// 5pm exercise 30mins .8
// >>>
export function parseEvents(eventsString): Event[] {
    let referenceDate = luxon.DateTime.local()

    return eventsString.split(`\n`).map(l => l.trim()).filter(x => !!x).map(line => {
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

        const start = referenceDate.set(parseTime(parts[0])).toMillis()
        
        if(type == 'food') {
            const amount = parseFloat(parts[2].replace('g','')) // ignore g suffix
            const foodType = parts[3]
            let gi
            if(foodType == 'carbs') {
                gi = parseFloat(parts[4])
            }
            return {
                type,
                amount,
                start,
                foodType,
                gi
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
            return {
                type,
                intensity,
                start,
                duration: duration*MINUTE
            }
        }
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
                    duration: duration*MINUTE
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
            const { start, amount } = event
            return compose(
                functions.basalEffect(
                    amount
                ),
                functions.beginsAfter({
                    start
                })
            )
        }
        default: 
            throw new Error(`Unknown event type ${event.type}`)
    }
}

class Model {
    sgv
    date

    constructor({}) {}

    static simulate(observed: GlucoseFeed, intoFuture: number = 0, events: Function[], model: BodyMetabolismModel): GlucoseFeed {
        if(!observed.length) {
            return []
            console.debug("No entries")
        }
        let d = []
        
        // Step.

        // Initial params.
        let startDate = _.first(observed).date
        let startSGV = observed[0].sgv
        let until = _.last(observed).date

        // Model
        metabolism = model
        // metabolism = new BodyMetabolismModel()
        // Effects
        let imperativeEffects = [
            BackgroundGlucoseEffect,
        ]

        // console.log(userEvents)
        const functionalEffects = [].concat(events.map(eventToFunction))

        // Current state
        let date = startDate
        let sgv = startSGV

        const STEP_SIZE = 1*MINUTE // 30s
        for(; date <= until + intoFuture; date += STEP_SIZE) {
            imperativeEffects.map(effect => {
                sgv += effect({ date, sgv, duration: STEP_SIZE })
            })

            const functionalSgv = functionalEffects.map(f => f(date)).reduce((prev, curr) => prev + curr, sgv)

            d.push({
                sgv: functionalSgv,
                date
            })
        }

        return d
    }
}

export {
    Model
}

