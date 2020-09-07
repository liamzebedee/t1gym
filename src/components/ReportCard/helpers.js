// https://bl.ocks.org/Ro4052/caaf60c1e9afcd8ece95034ea91e1eaa
import * as d3 from "d3"
import React from "react"

// Rescale the PGS value into
// something which suits a linear colour scale.
function rescalePgs(pgs) {
  /**
   * PGS <35 excellent glycemic status (non-diabetic)
   * PGS 35-100 good glycemic status (diabetic)
   * PGS 100-150 poor glycemic status (diabetic)
   * PGS >150 very poor glycemic status (diabetic)
   */
  if (pgs <= 35) {
    return (pgs / 35) * (1 / 3)
  }
  if (pgs <= 100) {
    return (pgs / 100) * (2 / 3)
  }
  if (pgs <= 150) {
    return (pgs / 150) * (3 / 3)
  }
  return 1
}

export const color = (x) => d3.interpolateRdYlGn(1 - rescalePgs(x))
