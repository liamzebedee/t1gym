// https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4543190/#!po=21.4286
import { Box, Heading, Tab, TabList, Tabs } from "@chakra-ui/core";
import { createHashHistory } from "history";
import {
    HashRouter as Router,
    Route, 
    Switch
} from "react-router-dom";
import { BGSModel } from '../../misc/contexts';
import { AppWrapper } from '../AppWrapper';
import { Logbook } from '../Logbook';
import { ReportCard } from '../ReportCard';
import styles from './index.module.css';
const history = createHashHistory();

const App = () => {
    return <AppWrapper>
        <BGSModel>
            <Router history={history}>
                <Box p="5">
                    <Heading pt="5" pb="5">
                        <img alt="Type One Gym" className={styles.logo} src="/images/logo.png" />
                    </Heading>
                    <Tabs variantColor="green">
                        <TabList>
                            {/* TODO fix */}
                            <Tab onClick={() => history.push('/')}>
                                Overview
                            </Tab>
                            <Tab onClick={() => history.push('/logbook')}>
                                Logbook
                            </Tab>
                        </TabList>
                    </Tabs>

                    <Switch>
                        <Route path="/" exact>
                            <Box p={5} boxShadow="lg">
                                <Heading size="xl">
                                    How am I tracking?
                                </Heading>

                                <Box pt={5}>
                                    <ReportCard />
                                </Box>
                            </Box>
                        </Route>

                        <Route path="/logbook" exact component={Logbook} />
                        <Route path='/logbook/entry/:id/' component={() => <Logbook />}/>
                    </Switch>

                    {/* <footer>
                        <small>t1 gym - v1.0.0-diabeta</small>
                    </footer> */}
                </Box>
            </Router>
        </BGSModel>
    </AppWrapper>
}

export default App