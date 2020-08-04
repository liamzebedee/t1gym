import 'react-datetime/css/react-datetime.css'
import { useEffect, useState } from 'react'
import { useLayoutEffect } from 'react'

import * as firebase from "firebase/app";
import "firebase/analytics";
import "firebase/auth";
import "firebase/firestore";

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
  firebase.analytics();
}

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }) {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    initialiseFirebase()
    setLoaded(true)
  }, [])

  if(!loaded) return null
  
  return <>
    <Component {...pageProps} />
  </>
}