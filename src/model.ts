
const _ = require('lodash')
const {linear} = require('everpolate')

type GlucoseFeed = BGLMeasurement[]

interface BGLMeasurement {
    sgv: number
    date: number // timestamp
}

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
    public insulinSensitivity
    public carbSensitivity
    public insulinActive

    constructor(opts) {
        Object.assign(this, opts)
    }

    // Insulin sensitivity is the ratio of 1 insulin unit : x mmol blood glucose reduction.
    getInsulinSensitivity(): number {
        return this.insulinSensitivity
    }

    // Carb sensitivity is the ratio of 1g of carbs raising x mmol.
    getCarbSensitivty(): number {
        return this.carbSensitivity
    }
}

let metabolism = new BodyMetabolismModel({
    insulinSensitivity: -2.0,
    carbSensitivity: 2.9,
    insulinActive: 1.0
})

// Fiasp insulin model.
// HOUR IOB
// TODO: use the actual exponential curve they defined in the paper.
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
            intensity * -6 / (60*MINUTE / u) // burn -6mmol every 60 minutes of exercise
    },

    // Returns insulin active at t hours, capping at amount when all insulin is released.
    fiaspInsulinActive(amount) {
        return u => {
            // Scale u by slowness
            // TODO: testing ideas.
            const u1 = u / 0.9
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

    // Returns insulin's effect on glucose levels, given an insulin active curve.
    insulinGlucoseEffect(insulinActive) {
        return (u) => {
            return insulinActive(u) * metabolism.getInsulinSensitivity()
        }
    },

    /*
     * Returns food digested at t hours, capping at amount when all food is digested.
     * @param {string} type Type of food, 'protein' or 'carbs'.
     * @param {Number} amount The grams of carbs or protein in the food.
     * @param {float} glycemicIndex The glycemic index, ranging from 1 (jellybeans) to 0 (slow-release foods).
     */
    foodDigestion(type, amount, glycemicIndex) {
        let amount2 = amount
        if(type == 'protein') {
            // Protein rule-of-thumb: it requires 1/5th the amount of insulin 
            // as carbs.
            amount2 /= 5
            const PROTEIN_DEFAULT_GI = 0.4
            if(!glycemicIndex) glycemicIndex = PROTEIN_DEFAULT_GI
        }

        return u => {
            // Linear release
            // This model assumes a food with GI 0 is released over a maximum of 6 hours.
            // TOOD: need to adjust this.
            const duration = (1-glycemicIndex) * 6*HOUR
            return amount2 * Math.min(u, duration) / duration
        }
    },

    foodDigestionEffect(foodDigestion) {
        return (u) => {
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


class Model {
    sgv
    date

    constructor({}) {}

    /**
     * Runs the simulation for the length of the `observed` glucose feed, plus time `intoFuture`.
     * 
     * The model is composed of parameters (BodyMetabolismModel) and a list of effects 
     * (`functionalEffects` and `imperativeEffects`).
     * 
     * A discrete timestep simulation is run, which generates an (x,y) pair of (time, bgl).
     * The blood glucose level (bgl) can be affected by functions termed "effects".
     * These functions take the date as input, and output a positive or negative `y` value
     * which represents change in glucose. For example, using `functions.exercise`, one can
     * model the effect that exercise has on reducing blood sugars. 
     */
    static simulate(observed: GlucoseFeed, intoFuture: number = 0, functionalEffects: Function[], model: BodyMetabolismModel): GlucoseFeed {
        if(!observed.length) {
            return []
        }

        let d = []
        
        // Step.

        // Initial params.
        let startDate = _.first(observed).date
        let startSGV = observed[0].sgv
        let until = _.last(observed).date

        // Model
        metabolism = model

        // Effects
        let imperativeEffects = [
            // BackgroundGlucoseEffect,
        ]

        // Current state
        let date = startDate
        let sgv = startSGV

        const STEP_SIZE = 1*MINUTE
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

