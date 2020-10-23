// https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4543190/#!po=21.4286
import { Box, Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/core";
import { AppWrapper } from '../AppWrapper';
import { Logbook } from '../Logbook';
import { ReportCard } from '../ReportCard';
import { Scenarios } from '../Scenarios';
import styles from './index.module.css';

export const App = () => {
    return <AppWrapper>
        <Box p="5">
            <Heading pt="5" pb="5">
                <img alt="Type One Gym" className={styles.logo} src="/images/logo.png"/>
            </Heading>
            <Tabs variantColor="green">
                <TabList>
                    <Tab>Overview</Tab>
                    {process.env.NEXT_PUBLIC_AB_LOGBOOK && 
                    <Tab>Logbook</Tab> }
                    {process.env.NEXT_PUBLIC_AB_PATTERNS && 
                    <Tab>Patterns</Tab> }
                </TabList>

                <TabPanels>

                    <TabPanel>
                        <Box p={5} boxShadow="lg">
                            <Heading size="xl">
                                How am I tracking?
                            </Heading>

                            <Box pt={5}>
                                <ReportCard/>
                            </Box>
                        </Box>
                    </TabPanel>

                    {process.env.NEXT_PUBLIC_AB_LOGBOOK && 
                    <TabPanel>
                        <Logbook/>
                    </TabPanel> }

                    {process.env.NEXT_PUBLIC_AB_PATTERNS && 
                    <TabPanel>
                        <Scenarios/>
                    </TabPanel> }
                    
                </TabPanels>
            </Tabs>

            {/* <footer>
                <small>t1 gym - v1.0.0-diabeta</small>
            </footer> */}
        </Box>
    </AppWrapper>
}
