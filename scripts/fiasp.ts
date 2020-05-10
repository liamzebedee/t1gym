const {step, linear} = require('everpolate')
const Model = require('../src/model')
// import { fiaspInsulinModel } from '../src/model'
const { fiaspInsulinModel } = Model

for(let i = 0; i < 6; i += 0.1) {
    console.log(
        linear(
            [i], 
            fiaspInsulinModel.map(a => a[0]),
            fiaspInsulinModel.map(a => a[1])
        )
    )
}

// console.log(
//     linear(
//         [0.25, 0.3, 1.6], 
//         fiaspInsulinModel.map(a => a[0]),
//         fiaspInsulinModel.map(a => a[1])
//     )
// )



export {}