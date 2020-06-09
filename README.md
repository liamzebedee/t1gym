diabetic metmabolic simulator
=============================

aka *diasim*. Runs a discrete timestep simulation of diabetic metabolism. 

 - live modelling of insulin, exercise, and food metabolism.
   - exercise: can specify intensity and duration.
   - food: can specify carbs or protein, and glycemic index
   - insulin: models the nonlinear release curve of Fiasp.
 - designed for use by insulin pump users
   - includes facilities to model basal/bolus parameters

## Install.

```bash
$ npm i
$ npm run dev

# open http://localhost:3000
```