import React from "react"
import { ProgressCalendar } from "../src/components/ReportCard/ProgressCalendar"

export default {
  title: "ProgressCalendar",
  component: ProgressCalendar,
}

export const Loading = () => <ProgressCalendar loading={true} />
