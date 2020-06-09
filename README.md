diabetic metabolic simulator
============================

aka *diasim*. Runs a discrete timestep simulation of diabetic metabolism. 

 - live modelling of insulin, exercise, and food metabolism.
   - exercise: can specify intensity and duration.
   - food: can specify carbs or protein, and glycemic index
   - insulin: models the nonlinear release curve of Fiasp.
 - downloads glucose feed from NightScout.
 - designed for use by insulin pump users
   - includes facilities to model basal/bolus parameters

## Install.

```bash
$ npm i
$ npm run dev

# open http://localhost:3000
```

## Usage.

*diasim* is in development. **You will need to download your NightScout glucose data to a local file** in `data/glucose.json`. This can be automated using a script.

```sh
NIGHTSCOUT_ENDPOINT_URL=https://<NIGHTSCOUT_SERVER>.herokuapp.com ./scripts/get-data.sh
```

Then you can start adding events and simulating different changes to your parameters. 
Here's a sample of events you can paste and use (implemented in `src/pages/helpers.ts`):

```bash
20/5/2020 begin

# TIME food AMOUNT (carbs/protein) GLYCEMIC_INDEX
14.00 food 20g carbs 80
15.00 food 20g protein
16.00 insulin 12.1

# Bolus/correct uses the specified pump ratios.
16.00 bolus 50g
16.00 correct 12.5

# TIME exercise DURATION INTENSITY
17.00 exercise 30mins .8
```