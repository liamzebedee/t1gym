
import { ThemeProvider, CSSReset } from "@chakra-ui/core";

export default () => {
    return <ThemeProvider>
        <CSSReset/>
        <Uploader />
    </ThemeProvider>
}

import { useCallback, useState } from 'react'

import FileInput from '@brainhubeu/react-file-input';

const luxon = require('luxon')
const DateTime = luxon.DateTime

function parseLibreLinkCSV(csv, opts) {
    const lines = csv.split('\n')
    const title = lines[0]
    const headings = lines[1].split(',')
    const data = lines.slice(2)
    
    const FIELDS = {
        Device: headings.indexOf('Device'),
        SerialNumber: headings.indexOf('Serial Number'),
        RecordType: headings.indexOf('Record Type'),
        HistoricGlucose: headings.indexOf('Historic Glucose mmol/L'),
        ScanGlucose: headings.indexOf('Scan Glucose mmol/L'),
        DeviceTimestamp: headings.indexOf('Device Timestamp'),
    }
    
    const RECORD_TYPE_ENUM = {
        HistoricGlucose: '0',
        ScanGlucose: '1'
    }
    
    
    
    if(!opts.TZ) throw new Error("TZ must be defined to parse the dates using the correct timezone.")
    DateTime.defaultZoneName = opts.TZ
    const DATE_FORMAT = "MM-dd-yyyy t"
    
    function convertMMolToMgDl(sgv) {
        return parseInt(sgv * 18.)
    }
    
    const res = data
    .map(line => line.split(','))
    .filter(fields => {
        return fields[FIELDS.RecordType] == RECORD_TYPE_ENUM.HistoricGlucose 
            || fields[FIELDS.RecordType] == RECORD_TYPE_ENUM.ScanGlucose
    })
    .map(fields => {
        let sgv
    
        const recordType = fields[FIELDS.RecordType]
        switch(recordType) {
            case RECORD_TYPE_ENUM.HistoricGlucose:
                sgv = fields[FIELDS.HistoricGlucose]
                break
            case RECORD_TYPE_ENUM.ScanGlucose:
                sgv = fields[FIELDS.ScanGlucose]
                break
            default:
                throw new Error(`Unexpected record type, ${recordType}`)
        }
    
        sgv = convertMMolToMgDl(parseFloat(sgv))
        
        const deviceTimestamp = fields[FIELDS.DeviceTimestamp]
        const datetime = DateTime.fromFormat(deviceTimestamp, DATE_FORMAT)
    
        const record = {
            sgv,
            date: datetime.toMillis(),
            device: `${fields[FIELDS.Device]} | ${fields[FIELDS.SerialNumber]}`
        }
    
        return record
    })

    return res
}

// Inspiration taken from Xdrip iOS-
// https://sourcegraph.com/github.com/JohanDegraeve/xdripswift/-/blob/xdrip/Managers/NightScout/BgReading+NightScout.swift#L12:14
function toNightscoutFormat(record) {
    return {
        app: "t1gym",
        type: "sgv",
        date: record.date,
        sysTime: record.date,
        dateString: DateTime.fromJSDate(new Date(record.date)).toJSDate().toString(),
        sgv: record.sgv,
        units: 'mmol',
        noise: 1
    }
}

const Uploader = () => {
    const [progress, setProgress] = useState(null)
    const [timezone, setTimezone] = useState("Australia/Brisbane")
    const [nightscoutUrl, setNightscoutUrl] = useState('https://zediabetes.herokuapp.com')
    const [nightscoutApiToken, setNightscoutApiToken] = useState('rig-3f678e6fa96ccab3')

    const onFile = useCallback((state) => {
        const file = state.value
        const reader = new FileReader()

        reader.readAsText(file)
        reader.addEventListener('loadend', async _ => {
            const text = reader.result
            
            setProgress('Parsing data...')
            const data = parseLibreLinkCSV(text, { TZ: timezone })
            console.log(data)

            setProgress('Uploading data to Nightscout...')

            const today = DateTime.local()
            const fromDate = today.minus({
                hours: 12
            })
            const toDate = today
            const [from,to] = [fromDate, toDate].map(d => d.toMillis())

            const filteredData = data.filter(record => {
                return record.date >= from && record.date <= to
            }).slice(10)
            console.log(filteredData)

            await fetch('/api/upload/libre', {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: filteredData.map(toNightscoutFormat),
                    nightscoutApiToken,
                    nightscoutUrl
                })
            })

            setProgress('Upload complete!')
        })
    }, [])

    return <>
        <ul>
        <li>Timezone: {timezone}</li>
        <li>Nightscout instance: {nightscoutUrl}</li>
        </ul>
        <br/>

        <a href="https://www.libreview.com/glucosereports">Go to LibreView</a> and download the CSV.

        <FileInput
            label="Drag LibreView CSV here..."
            onChangeCallback={onFile}
            />
        
        {progress}
    </>
}