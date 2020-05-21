import _ from 'lodash'
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

let metabolism

class BodyMetabolismModel {
    // Insulin sensitivity is the ratio of insulin units to blood glucose reduction.
    getInsulinSensitivity(): number {
        return -1.8
    }

    // 1g of carbs raises xmmol
    getCarbSensitivty(t): number {
        // 15g carb raises BGL by 3mmol
        // 15/3
        return .2
    }

    getDurationInsulinActivity(): number {
        return 2.2
    }
}


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

export const functions = {
    exercise(intensity) {
        return u => 
            (intensity) * (u*BURN_RATE)
    },

    // Insulin active
    // Returns insulin active at t hours, capping at amount when all insulin is released.
    fiaspInsulinActive(amount) {
        return u => {
            const y = linear(
                [u / HOUR],
                fiaspInsulinModel.map(a => a[0]),
                fiaspInsulinModel.map(a => a[1])
            )
            const delivered = (y[0] / 100) * amount
            // console.log(`amount:${amount}`, `delivered:${Math.min(delivered, amount)}`, `hours:${u / HOUR}`)
            return Math.min(delivered, amount)
        }
    },

    insulinGlucoseEffect(insulinActive) {
        // const insulinActive = functions.fiaspInsulinActive(amount)
        return (u, b, c) => {
            console.log(u, b, c, insulinActive(u), metabolism.getInsulinSensitivity())
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
    }
}


// Functional enhancer.
export const compose = (...fns) =>
    fns.reduceRight((prevFn, nextFn) =>
        (...args) => nextFn(prevFn(...args)),
        value => value
    )
;

// Parse events list
// eg. <<<
// 2pm food 20g carbs 80
// 3pm food 20g protein
// 4pm insulin 12.1
// 5pm exercise 30mins .8
// >>>
const chrono = require('chrono-node')
const luxon = require('luxon')

function parseEvents(events) {
    return events.split(`\n`).map(l => l.trim()).filter(x => !!x).map(line => {
        const parts = line.split(' ')
        
        function parseTime(time) {
            const [hour,minute] = time.split('.')
            return {
                hour, 
                minute
            }
        }
        let datetime = luxon.DateTime.local().set(parseTime(parts[0]))
        const start = datetime.toMillis()
        
        const type = parts[1]
        if(type == 'food') {
            const amount = parseFloat(parts[2].replace('g','')) // ignore g suffix
            const foodType = parts[3]
            let gi
            if(foodType == 'carbs') {
                gi = parseFloat(parts[4])
            }
            console.debug(start, type, amount, foodType, gi)
            return compose(
                functions.foodDigestionEffect(
                    functions.foodDigestion(foodType, amount, gi / 100)
                ),
                functions.beginsAfter({
                    start,
                })
            )
        }
        if(type == 'insulin') {
            const amount = parseFloat(parts[2])
            console.debug(start, type, amount)
            return compose(
                functions.insulinGlucoseEffect(
                    functions.fiaspInsulinActive(amount)
                ),
                functions.beginsAfter({
                    start,
                })
            )
        }
        if(type == 'exercise') {
            // TODO
        }
    })
}

class Model {
    sgv
    date

    constructor({}) {}

    static simulate(observed: GlucoseFeed, intoFuture: number = 0): GlucoseFeed {
        if(!observed.length) {
            return []
            console.debug("No entries")
        }
        let d = []
        
        // Step.

        // Initial params.
        let startDate = observed[0].date
        let startSGV = observed[0].sgv
        let until = _.last(observed).date

        // Model
        metabolism = new BodyMetabolismModel()
        // Effects
        let effects = [
            BackgroundGlucoseEffect,
        ]

        let userEvents =parseEvents(`
        10.55 food 60g carbs 80
        11.24 insulin 5
        12.31 insulin 5.6
        13.12 insulin 1
        `)
        console.log(userEvents)
        const functionalEffects = [
            // compose(
            //     functions.exercise(0.8),
            //     functions.window({
            //         start: startDate + (20 * MINUTE),
            //         duration: 50*MINUTE
            //     })
            // ),

            // // Mock dumplings.
            // // nom nom nom.
            // compose(
            //     functions.foodDigestionEffect(
            //         functions.foodDigestion('carbs', 80, 63 / 100)
            //     ),
            //     functions.beginsAfter({
            //         start: startDate,
            //     })
            // ),

            // compose(
            //     functions.insulinGlucoseEffect(
            //         functions.fiaspInsulinActive(12)
            //     ),
            //     functions.beginsAfter({
            //         start: startDate + 20 * MINUTE,
            //     })
            // )
        ].concat(userEvents)


        // Current state
        let date = startDate
        let sgv = startSGV

        const STEP_SIZE = 1*MINUTE // 30s
        for(; date <= until + intoFuture; date += STEP_SIZE) {
            effects.map(effect => {
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

