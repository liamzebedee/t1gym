import React from 'react';
import { Chart } from '../src/components/Chart';
import { bgs, basalEntries, treatments } from './fixtures';
import { NightscoutProfilesContext } from '../src/misc/contexts';

export default {
    title: 'Chart',
    component: Chart,
}

export const Primary = () => <>
    <NightscoutProfilesContext.Provider value={[]}>
        <Chart data={bgs} events={treatments} showTempBasalChart={true}/>
    </NightscoutProfilesContext.Provider>
</>