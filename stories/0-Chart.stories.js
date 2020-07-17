import React from 'react';
import { linkTo } from '@storybook/addon-links';
import { Welcome } from '@storybook/react/demo';

import { Chart } from '../src/components/Chart/index'

export default {
  title: 'Chart',
  component: Chart,
};

import data from '../data/glucose.json'
import { convertData } from '../src/pages/helpers';

const annotation = {
  startTime: +new Date("2020-07-12T07:00:13.778+10:00"),
  endTime: +new Date("2020-07-12T10:00:13.778+10:00")
}

export const Highlights = () => <Chart 
  data={convertData(data)}
  annotations={[ annotation ]}
/>