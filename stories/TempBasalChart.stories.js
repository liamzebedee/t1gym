import React from 'react';
import { TempBasalChart } from '../src/components/Chart';
import { basalEntries } from './fixtures';

export default {
    title: 'TempBasalChart',
    component: TempBasalChart,
}

export const Primary = () => <TempBasalChart extent={[1599487245366,1599573645366]} basalSeries={basalEntries}/>