async function uploadToNightscout(data, opts) {
    // Post to Nightscout
    const tokenAuth = `token=${opts.NIGHTSCOUT_API_TOKEN}`
    const url = `${opts.NIGHTSCOUT_ENDPOINT_URL}/api/v1/entries.json?${tokenAuth}`
    
    const response = await fetch(url, {
		method: 'post',
		body: JSON.stringify(data),
		headers: {
            'Content-Type': 'application/json'
        }
    })
    return response
}

export default async (req, res) => {
    const {
        nightscoutApiToken,
        nightscoutUrl,
        data
    } = req.body

    console.log(nightscoutApiToken,
        nightscoutUrl, data)


    const nsRes = await uploadToNightscout(data, {
        NIGHTSCOUT_ENDPOINT_URL: nightscoutUrl,
        NIGHTSCOUT_API_TOKEN: nightscoutApiToken
    })

    if(nsRes.status != 200) {
        console.error(await nsRes.json())
        throw new Error("Bad response from Nightscout: " + nsRes.status)
    }

    res.status(200).json({})   
}