import 'react-datetime/css/react-datetime.css'
import { useEffect, useState } from 'react'
import { useLayoutEffect } from 'react'

import * as firebase from "firebase/app";
import "firebase/analytics";
import "firebase/auth";
import "firebase/firestore";

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }) {
  const [loaded, setLoaded] = useState(false)

  function initialiseFirebase() {
    const firebaseConfig = {
      apiKey: "AIzaSyCb_ngSJOr7w-SIVWmt_wTMnQVFFE9b_VM",
      authDomain: "diasim.firebaseapp.com",
      databaseURL: "https://diasim.firebaseio.com",
      projectId: "diasim",
      storageBucket: "diasim.appspot.com",
      messagingSenderId: "995306789526",
      appId: "1:995306789526:web:91f4707e70324557a4c0b7",
      measurementId: "G-8WLEW1EBLM"
    }
    
    // Initialize Firebase
    try {
      firebase.initializeApp(firebaseConfig)
    } catch (error) {
      /*
       * We skip the "already exists" message which is
       * not an actual error when we're hot-reloading.
       */
      if (!/already exists/u.test(error.message)) {
        // eslint-disable-next-line no-console
        console.error('Firebase admin initialization error', error.stack);
      }
    }
    firebase.analytics()

    setLoaded(true)
  }

  useEffect(() => {
    initialiseFirebase()
  }, [])

  if(!loaded) return null
  
  return <>
    <Component {...pageProps} />
  </>
}