// https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4543190/#!po=21.4286
import { Box, Heading, Tab, TabList, Tabs } from "@chakra-ui/core";
import { createHashHistory } from "history";
import { QueryCache, ReactQueryCacheProvider } from 'react-query';
import {
    HashRouter as Router,
    Route,
    Switch,
    useLocation,
    matchPath
} from "react-router-dom";
import { BGSModel } from '../../misc/contexts';
import { MINUTE } from "../../model";
import { AppWrapper } from '../AppWrapper';
import { Logbook } from '../Logbook';
import { ReportCard } from '../ReportCard';
import { ViewLogbookEntry } from "../ViewLogbookEntry";
import { ViewPatternBank } from "../ViewPatternBank";
import styles from './index.module.css';
const history = createHashHistory();

const queryCache = new QueryCache({
    defaultConfig: {
        queries: {
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            staleTime: 5 * MINUTE,
        },
    },
})

const TABS = [
    {
        name: 'Overview',
        path: '/'
    },
    {
        name: 'Logbook',
        path: '/logbook'
    }
]

const TabMenu = () => {
    const location = useLocation()

    let activeTab = -1
    TABS.forEach(({ path }, i) => {
        if(location.pathname.startsWith(path))
            activeTab = i
    })

    return <Tabs variantColor="green" defaultIndex={activeTab}>
        <TabList>
            {
                TABS.map(({ name, path }) => <Tab onClick={() => history.push(path)}>
                    {name}
                </Tab>)
            }
        </TabList>
    </Tabs>
}

const App = () => {
    return <AppWrapper>
        <ReactQueryCacheProvider queryCache={queryCache}>
            <BGSModel>
                <Router history={history}>
                    <Box p="5">
                        <Heading pt="5" pb="5">
                            <img alt="Type One Gym" className={styles.logo} src="/images/logo.png" />
                        </Heading>
                        
                        <TabMenu/>

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
                            <Route path='/logbook/entry/:id/' component={ViewLogbookEntry} />
                            <Route path='/beta/view-pattern-bank' component={ViewPatternBank} />
                        </Switch>

                        {/* <footer>
                            <small>t1 gym - v1.0.0-diabeta</small>
                        </footer> */}
                    </Box>
                </Router>
            </BGSModel>
        </ReactQueryCacheProvider>
    </AppWrapper>
}

export default App