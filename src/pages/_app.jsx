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
    firebase.initializeApp(firebaseConfig)
    firebase.analytics()
    
    const auth = firebase.auth()
    auth.onAuthStateChanged(async function(user) {
      if (user) {
        // For later calls to the backend, we use the `token` as a session cookie.
        // It will be used to identify the user using the Firebase API.
        // Since Firebase auth tokens expire after a certain amount of time,
        // we refresh the token upon load.
        const token = await user.getIdToken(true)
        console.debug(`Setting Firebase token to ${token}`)
        document.cookie = `token=${token}; path=/`

        setLoaded(true)
      }
    })
  }

  useEffect(() => {
    initialiseFirebase()
  }, [])

  if(!loaded) return null
  
  return <>
    <Component {...pageProps} />
  </>
}