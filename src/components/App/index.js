// https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4543190/#!po=21.4286
import { formatPlotlyDate } from "../../pages/experiment"
import * as d3 from "d3"
import { useEffect, useRef, useState } from "react"

import {
  ThemeProvider,
  CSSReset,
  TabList,
  Tabs,
  TabPanels,
  Tab,
  TabPanel,
  Box,
  Stack,
  Tag,
  TagLabel,
  Heading,
  CircularProgress,
} from "@chakra-ui/core"
import { useReducer } from "react"
import { useLayoutEffect } from "react"
import { Chart } from "../Chart"

import { Annotator } from "../Annotator"
import * as luxon from "luxon"
import { Duration, DateTime } from "luxon"

import DatabaseService from "../../misc/db_service"
import { Analyse } from "../Analyse"
import styles from "./index.module.css"

import { Scenarios } from "../Scenarios"
import {
  getStartOfDayForTime,
  usePromiseLoadingState,
  convertData,
} from "../../pages/helpers"
import { AnnotatorContainer } from "../Annotator/Container"
import { ReportCard } from "../ReportCard"
import { FirebaseAuthWrapper } from "../../misc/wrappers"
import { AppWrapper } from "../AppWrapper"

export const App = () => {
  return (
    <AppWrapper>
      <Box p="5">
        <Heading pt="5" pb="5">
          <img
            alt="Type One Gym"
            className={styles.logo}
            src="/images/logo.png"
          />
        </Heading>
        <Tabs variantColor="green">
          <TabList>
            <Tab>Overview</Tab>
            {process.env.NEXT_PUBLIC_AB_LOGBOOK && <Tab>Analyse</Tab>}
            {process.env.NEXT_PUBLIC_AB_PATTERNS && <Tab>Patterns</Tab>}
          </TabList>

          <TabPanels>
            <TabPanel>
              <Box p={5} boxShadow="lg">
                <Heading size="xl">How am I tracking?</Heading>

                <Box pt={5}>
                  <ReportCard />
                </Box>
              </Box>
            </TabPanel>

            {process.env.NEXT_PUBLIC_AB_LOGBOOK && (
              <TabPanel>
                <Analyse />
              </TabPanel>
            )}

            {process.env.NEXT_PUBLIC_AB_PATTERNS && (
              <TabPanel>
                <Scenarios />
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>

        {/* <footer>
                <small>t1 gym - v1.0.0-diabeta</small>
            </footer> */}
      </Box>
    </AppWrapper>
  )
}
