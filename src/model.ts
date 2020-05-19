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
    getInsulinSensitivity(t): number {
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


function fiaspInsulinEffect({ 
    metabolism,
    amount,
    injectionDate,
    insulinModel = fiaspInsulinModel
}) {
    let active = true
    
    // Returns insulin applied between t and t+DURATION
    return ({ date, sgv, duration }) => {
        if(!active) return 0

        let x1 = (date - injectionDate)
        let x2 = x1 + duration
        
        // map time to hours
        x1 = x1 / HOUR
        x2 = x2 / HOUR
        if(x1 < 0) return 0
        
        const netInsulin = linear(
            [x1, x2],
            fiaspInsulinModel.map(a => a[0]),
            fiaspInsulinModel.map(a => a[1])
        )

        if(netInsulin[0] >= 100) {
            active = false
        }

        const activeInsulinFraction = (netInsulin[1] - netInsulin[0]) / 100
        
        // Calculate amount.
        const activeInsulinAmount = activeInsulinFraction * amount
        // console.log(`active insulin ${activeInsulinFraction}, ${activeInsulinAmount} U`)

        return activeInsulinAmount * metabolism.getInsulinSensitivity()
    }
}

type MealType = 'protein' | 'carbs'
interface FoodEffect {
    mealType: MealType
    amount: number
    glycemicIndex: number
}

function foodEffect({
    mealType,
    amount,
    glycemicIndex,
    ingestionDate
}) {
    let active = true
    
    // Protein rule is.
    // Divide whatever the amount is by 5.
    // Idk why.
    if(mealType == 'protein') {
        amount /= 5
    }

    glycemicIndex = glycemicIndex / 100

    return ({ date, sgv, duration }) => {
        if(!active) return 0
        // Food is a linear release.
        // Weighted by the glycemic index.

        // Individual responses vary a bit.
        // http://www.cell.com/cell/fulltext/S0092-8674(15)01481-6
        let x1 = (date - ingestionDate)
        let x2 = x1 + duration

        // A lower glycemic load means it releases over a longer duration.
        // My longest duration is set at 6hrs as an example.
        // https://care.diabetesjournals.org/content/31/12/2281
        const MAX_ABSORPTION_TIME = (6*HOUR) * (1-glycemicIndex)
        let digested = x => {
            if(x > MAX_ABSORPTION_TIME) return 0
            const digestedRatio = 1 - (x / MAX_ABSORPTION_TIME)
            return digestedRatio * amount
        }
        
        const a1 = digested(x1)
        const a2 = digested(x2)
        let netCarbs = Math.abs(a1 - a2)
        // console.log(a2, a1, `carbs: ${netCarbs.toPrecision(2)}g`)
        
        return netCarbs * metabolism.getCarbSensitivty()
    }
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

    fiaspInsulin(amount) {
        return u => {
            const y = linear(
                [u / HOUR],
                fiaspInsulinModel.map(a => a[0]),
                fiaspInsulinModel.map(a => a[1])
            )
            return y[0]
        }
    },

    food(type, amount, glycemicIndex) {
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
            return amount * Math.min(u, duration) / duration
        }
    }
}

// Exercise is modelled as a linear curve.
export function exerciseEffect({ start, duration, intensity }) {
    // `u` denotes relative time
    const F = (u) => {
        return (intensity * BURN_RATE) * (u/duration)
    }

    return window({
        start,
        end: start + duration,
        F
    })
}

function window({ start, end, F }) {
    return (t) => {
        if(t < start) return 0
        if(t > start && t < end) {
            const u = t - start
            return F(u)
        }
        if(t >= end) return F(end - start)
    }
}

function insulinEffect() {
    return ({ date, sgv, duration }) => {
        return 0
    }
}


class Model {
    sgv
    date

    constructor({}) {}

    static simulate(observed: GlucoseFeed): GlucoseFeed {
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
            
            // Mock injection of 1U of insulin.
            // 
            fiaspInsulinEffect({
                metabolism,
                amount: 12,
                injectionDate: startDate + 20 * MINUTE
            }),

            // Mock dumplings.
            // nom nom nom.
            foodEffect({
                amount: 80,
                glycemicIndex: 63,
                mealType: 'carbs',
                ingestionDate: startDate
            }),

        ]
        const functionalEffects = [
            exerciseEffect({
                intensity: ExerciseIntensity.Cardio,
                start: startDate,
                duration: 50 * MINUTE
            })
        ]

        // Current state
        let date = startDate
        let sgv = startSGV

        const STEP_SIZE = 2*MINUTE // 30s
        for(; date <= until; date += STEP_SIZE) {
            effects.map(effect => {
                sgv += effect({ date, sgv, duration: STEP_SIZE })
            })

            const functionalSgv = functionalEffects.map(f => f(date)).reduce((prev, curr) => prev + curr, sgv)
            console.log(functionalSgv)

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
