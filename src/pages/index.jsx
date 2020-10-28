import Head from 'next/head'

// Disable SSR for entire app. :'(
// Needed for React Router to function.
import dynamic from 'next/dynamic'
const App = dynamic(() => import('../components/App'), {
  ssr: false // process.env.NEXT_PUBLIC_SSR_ENABLED
})

export default () => <>
    <Head>
        <title>T1 Gym</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <link rel="icon" href="/favicon.png"/>
    </Head>
    <App/>
</>