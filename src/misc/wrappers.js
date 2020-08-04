import * as firebase from "firebase/app";
import { useState, useEffect } from "react";

export const FirebaseAuthWrapper = ({ children }) => {
    const [loaded, setLoaded] = useState(false)

    function initialiseFirebase() {
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

                setLoaded(true)
            }
        })
    }

    useEffect(() => {
        initialiseFirebase()
    }, [])

    if (!loaded) return null
    return children
}