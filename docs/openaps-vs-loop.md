Differences between Nightscout data
===================================

## Treatments

 1. Nightscout stores treatments with a `created_at` field encoded as a UTC date string.
    This contrasts with entries, which have the numeric Unix timestamp as a `date` field. Sigh.
    
 2. `created_at` is ALWAYS in the UTC timezone. 
    The `timestamp` field has varying timezone, depending on implementation.
    In Loop, it is in the UTC timezone.
    In OpenAPS, it is in the user's local timezone.

### Meal Bolus

#### OpenAPS

```json
{
    "_id": "5f1afb118b6aca48aa123400",
    "duration": 0,
    "bolus": {
    "timestamp": "2020-07-22T00:01:59+10:00",
    "_type": "Bolus",
    "id": "AVJSAHvBQBYU",
    "amount": 8.2,
    "programmed": 8.2,
    "unabsorbed": 0,
    "duration": 0
    },
    "timestamp": "2020-07-22T00:01:59+10:00",
    "created_at": "2020-07-21T14:01:59.000Z",
    "carbs": 82,
    "ratio": "10",
    "wizard": {
        "timestamp": "2020-07-22T00:01:59+10:00",
        "_type": "BolusWizard",
        "id": "WwB7wQAWFFKQChlBAFIAAAAAUkE=",
        "carb_input": 82,
        "carb_ratio": 10,
        "correction_estimate": 0,
        "food_estimate": 8.2,
        "unabsorbed_insulin_total": 0,
        "bolus_estimate": 8.2,
        "bg": 0,
        "bg_target_low": 6.5,
        "bg_target_high": 6.5,
        "sensitivity": 2.5,
        "units": "mmol"
    },
    "eventType": "Meal Bolus",
    "insulin": 8.2,
    "notes": "Normal bolus with wizard.\nCalculated IOB: -0.203\nProgrammed bolus 8.2\nDelivered bolus 8.2\nPercent delivered:  100%\nFood estimate 8.2\nCorrection estimate 0\nBolus estimate 8.2\nTarget low 6.5\nTarget high 6.5\nHypothetical glucose delta -20.5",
    "medtronic": "mm://openaps/mm-format-ns-treatments/Meal Bolus",
    "enteredBy": "openaps://medtronic/722",
    "utcOffset": 600
}
```

### Correction bolus

#### Loop

```json
{
    "_id": "5f1904678b6aca48aaf74218",
    "timestamp": "2020-07-22T01:53:48Z",
    "insulin": 1.2,
    "created_at": "2020-07-22T01:53:48.000Z",
    "unabsorbed": 0,
    "type": "normal",
    "enteredBy": "loop://Liam Edwards-Playne’s iPhone",
    "eventType": "Correction Bolus",
    "duration": 0.8,
    "programmed": 1.2,
    "utcOffset": 0
}
```

### Temp Basal

#### OpenAPS
```json
{
    "_id": "5f1610b68b6aca48aacec0ec",
    "duration": 30,
    "raw_duration": {
     "timestamp": "2020-07-21T07:44:22+10:00",
     "_type": "TempBasalDuration",
     "id": "FgFW7AdVFA==",
     "duration (min)": 30
    },
    "timestamp": "2020-07-21T07:44:22+10:00",
    "absolute": 1.35,
    "rate": 1.35,
    "raw_rate": {
     "timestamp": "2020-07-21T07:44:22+10:00",
     "_type": "TempBasal",
     "id": "MzZW7AdVFAA=",
     "temp": "absolute",
     "rate": 1.35
    },
    "eventType": "Temp Basal",
    "medtronic": "mm://openaps/mm-format-ns-treatments/Temp Basal",
    "created_at": "2020-07-20T21:44:22.000Z",
    "enteredBy": "openaps://medtronic/722",
    "utcOffset": 600,
    "carbs": null,
    "insulin": null
}
```

## Profiles

### Loop

```json
{
 "_id": "5f2970e4345df400040d7714",
 "defaultProfile": "Default",
 "loopSettings": {
  "preMealTargetRange": [
   5,
   6
  ],
  "maximumBasalRatePerHour": 5.3,
  "deviceToken": "116e0c5c39c60e9e82a625fb7d5d4d7e9cba6a1a15993173a28c54b15d9fc7ed",
  "minimumBGGuard": 5,
  "bundleIdentifier": "co.liamz.Loop2",
  "dosingEnabled": false,
  "maximumBolus": 20,
  "overridePresets": [
   {
    "targetRange": [
     6.5,
     7.500000000000002
    ],
    "insulinNeedsScaleFactor": 0.7,
    "name": "running",
    "symbol": "🏃‍♂️",
    "duration": 3600
   },
   {
    "duration": 3600,
    "targetRange": [
     6,
     7
    ],
    "insulinNeedsScaleFactor": 1.2,
    "name": "Resistant",
    "symbol": "⚠️"
   },
   {
    "targetRange": [
     10,
     12
    ],
    "symbol": "🏑",
    "name": "pre-exercise",
    "duration": 7200
   }
  ]
 },
 "store": {
  "Default": {
   "delay": "0",
   "timezone": "ETC/GMT-10",
   "sens": [
    {
     "time": "00:00",
     "value": 2.5,
     "timeAsSeconds": 0
    },
    {
     "timeAsSeconds": 21600,
     "value": 1.8,
     "time": "06:00"
    },
    {
     "value": 2.2,
     "timeAsSeconds": 34200,
     "time": "09:30"
    },
    {
     "time": "18:00",
     "timeAsSeconds": 64800,
     "value": 2.5
    }
   ],
   "dia": 6.166666666666667,
   "target_high": [
    {
     "time": "00:00",
     "timeAsSeconds": 0,
     "value": 7.1
    }
   ],
   "target_low": [
    {
     "time": "00:00",
     "timeAsSeconds": 0,
     "value": 6
    }
   ],
   "carbs_hr": "0",
   "carbratio": [
    {
     "timeAsSeconds": 0,
     "time": "00:00",
     "value": 10
    },
    {
     "value": 8.5,
     "time": "07:00",
     "timeAsSeconds": 25200
    },
    {
     "time": "12:00",
     "value": 10,
     "timeAsSeconds": 43200
    },
    {
     "time": "17:00",
     "timeAsSeconds": 61200,
     "value": 12
    }
   ],
   "basal": [
    {
     "timeAsSeconds": 0,
     "time": "00:00",
     "value": 0.75
    },
    {
     "value": 0.6,
     "time": "08:00",
     "timeAsSeconds": 28800
    },
    {
     "time": "17:00",
     "value": 0.75,
     "timeAsSeconds": 61200
    }
   ]
  }
 },
 "enteredBy": "Loop",
 "units": "mmol/L",
 "startDate": "2020-08-04T14:29:54Z",
 "mills": "1596551394324"
}
```

### OpenAPS

```json
{
 "_id": "5eea5bcc42055500042c7e74",
 "defaultProfile": "OpenAPS Autosync",
 "store": {
  "Main": {
   "dia": "3",
   "carbratio": [
    {
     "time": "00:00",
     "value": "30",
     "timeAsSeconds": "0"
    }
   ],
   "carbs_hr": "20",
   "delay": "20",
   "sens": [
    {
     "time": "00:00",
     "value": "100",
     "timeAsSeconds": "0"
    }
   ],
   "timezone": "Australia/Brisbane",
   "basal": [
    {
     "time": "00:00",
     "value": "0.1",
     "timeAsSeconds": "0"
    }
   ],
   "target_low": [
    {
     "time": "00:00",
     "value": "0",
     "timeAsSeconds": "0"
    }
   ],
   "target_high": [
    {
     "time": "00:00",
     "value": "0",
     "timeAsSeconds": "0"
    }
   ],
   "startDate": "1970-01-01T00:00:00.000Z",
   "units": "mmol"
  },
  "OpenAPS Autosync": {
   "dia": 2,
   "carbratio": [
    {
     "time": "00:00",
     "value": "10.2",
     "timeAsSeconds": "0"
    },
    {
     "time": "07:00",
     "value": "7",
     "timeAsSeconds": "25200"
    },
    {
     "time": "10:00",
     "value": "12",
     "timeAsSeconds": "36000"
    },
    {
     "time": "17:00",
     "value": "12",
     "timeAsSeconds": "61200"
    }
   ],
   "carbs_hr": "20",
   "delay": "20",
   "sens": [
    {
     "time": "00:00",
     "value": "2.8",
     "timeAsSeconds": "0"
    },
    {
     "time": "06:00",
     "value": "2",
     "timeAsSeconds": "21600"
    },
    {
     "time": "09:30",
     "value": "2",
     "timeAsSeconds": "34200"
    }
   ],
   "timezone": "Australia/Brisbane",
   "basal": [
    {
     "time": "00:00",
     "value": "0.9",
     "timeAsSeconds": "0"
    },
    {
     "time": "01:00",
     "value": "0.9",
     "timeAsSeconds": "3600"
    },
    {
     "time": "02:00",
     "value": "0.87",
     "timeAsSeconds": "7200"
    },
    {
     "time": "03:00",
     "value": "0.89",
     "timeAsSeconds": "10800"
    },
    {
     "time": "04:00",
     "value": "0.87",
     "timeAsSeconds": "14400"
    },
    {
     "time": "05:00",
     "value": "0.79",
     "timeAsSeconds": "18000"
    },
    {
     "time": "06:00",
     "value": "0.9",
     "timeAsSeconds": "21600"
    },
    {
     "time": "07:00",
     "value": "0.87",
     "timeAsSeconds": "25200"
    },
    {
     "time": "08:00",
     "value": "0.83",
     "timeAsSeconds": "28800"
    },
    {
     "time": "09:00",
     "value": "0.8",
     "timeAsSeconds": "32400"
    },
    {
     "time": "10:00",
     "value": "0.63",
     "timeAsSeconds": "36000"
    },
    {
     "time": "11:00",
     "value": "0.64",
     "timeAsSeconds": "39600"
    },
    {
     "time": "12:00",
     "value": "0.72",
     "timeAsSeconds": "43200"
    },
    {
     "time": "13:00",
     "value": "0.79",
     "timeAsSeconds": "46800"
    },
    {
     "time": "14:00",
     "value": "0.84",
     "timeAsSeconds": "50400"
    },
    {
     "time": "15:00",
     "value": "0.83",
     "timeAsSeconds": "54000"
    },
    {
     "time": "16:00",
     "value": "0.84",
     "timeAsSeconds": "57600"
    },
    {
     "time": "17:00",
     "value": "0.86",
     "timeAsSeconds": "61200"
    },
    {
     "time": "18:00",
     "value": "0.86",
     "timeAsSeconds": "64800"
    },
    {
     "time": "19:00",
     "value": "0.85",
     "timeAsSeconds": "68400"
    },
    {
     "time": "20:00",
     "value": "0.85",
     "timeAsSeconds": "72000"
    },
    {
     "time": "21:00",
     "value": "0.85",
     "timeAsSeconds": "75600"
    },
    {
     "time": "22:00",
     "value": "0.9",
     "timeAsSeconds": "79200"
    },
    {
     "time": "23:00",
     "value": "0.9",
     "timeAsSeconds": "82800"
    }
   ],
   "target_low": [
    {
     "time": "00:00",
     "value": "6.4",
     "timeAsSeconds": "0"
    }
   ],
   "target_high": [
    {
     "time": "00:00",
     "value": "6.4",
     "timeAsSeconds": "0"
    }
   ],
   "startDate": "2020-06-17T18:07:06.855Z",
   "units": "mmol"
  }
 },
 "startDate": "2020-06-17T18:07:06.855Z",
 "mills": 1592417226855,
 "units": "mmol",
 "created_at": "2020-06-17T18:07:08.288Z"
}
```

