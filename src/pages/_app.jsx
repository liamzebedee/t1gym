import 'react-datetime/css/react-datetime.css'
import { useEffect, useState } from 'react'
import { useLayoutEffect } from 'react'

function checkForUserSessionCookie() {
  const params = new URLSearchParams(window.location.search)
  if(!params.has('diabetacode')) return
  const diabetacode = params.get('diabetacode')
  document.cookie = `diabetacode=${diabetacode}`;
}

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }) {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    checkForUserSessionCookie()  
    setLoaded(true)
  }, [])

  if(!loaded) return null
  
  return <>
    <Component {...pageProps} />
  </>
}