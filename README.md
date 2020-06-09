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