import React from 'react';
import { ReportCard } from '../src/components/ReportCard/index'
import { ProgressCalendar, ProgressCalendarContainer } from '../src/components/ReportCard/ProgressCalendar'

export default {
  title: 'ReportCard',
  component: ReportCard,
};

import { convertData } from '../src/pages/helpers';

export const Loading = () => <ProgressCalendar loading={true}/>