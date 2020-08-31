import * as firebase from "firebase/app";
import { useState, useEffect } from "react";
import { DateTime } from "luxon";

export async function initialiseFirebase() {
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
  
  await authenticateFirebase()
}

async function authenticateFirebase() {
    return new Promise((res, rej) => {
        const auth = firebase.auth()
        auth.onAuthStateChanged(async function (user) {
            if (user) {
                // For later calls to the backend, we use the `token` as a session cookie.
                // It will be used to identify the user using the Firebase API.
                // Since Firebase auth tokens expire after a certain amount of time,
                // we refresh the token upon load.
                const token = await user.getIdToken(true)
                console.debug(`Setting Firebase token to ${token}`)
                document.cookie = `token=${token}; path=/`
                res()
            }
        })
    })       
}


let tz
tz = Intl.DateTimeFormat().resolvedOptions().timeZone
if(!tz) {
    throw new Error("Couldn't determine timezone.")
}
console.debug(`Setting user timezone to - ${tz}`)
DateTime.defaultZoneName = tz

export { tz }