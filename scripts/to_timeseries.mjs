
import latestGlucoseFeed from '../data/glucose.json'

function convertFromMgToMmol(v) {
    return v / 18.
}


console.log(
    latestGlucoseFeed.map(r => {
        return `${Math.floor(r.date/1000)},${convertFromMgToMmol(r.sgv)}`
    }).join('\n')
)
// const Model = require('../src/model')