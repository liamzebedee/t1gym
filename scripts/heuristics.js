// A script to calculate basic diabetic heuristics for informing
// about model defaults.

const averageDailyInsulin = 45


// 500 rule.
// : Estimate insulin-to-carb ratio.
const insulin2Carbs = 500 / averageDailyInsulin

// 84 rule.
// : Estimate insulin corrections.
const insulin2Mmol = 84 / averageDailyInsulin


console.log(`Insulin to carbs: ${insulin2Carbs}`)
console.log(`Insulin to glucose: ${insulin2Mmol}`)