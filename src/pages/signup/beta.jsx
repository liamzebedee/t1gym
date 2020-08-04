
import * as firebase from "firebase/app";
import { useEffect, useState, useCallback } from 'react';

import { StatGroup, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, CircularProgress, Stack, Flex, Heading, Text, Box, ThemeProvider, CSSReset, Button } from '@chakra-ui/core';

import { usePromiseLoadingState, usePromiseLoadingStateWithError } from '../helpers'

async function _authenticate() {
    // The invite code is defined by the `code` URL parameter.
    const params = new URLSearchParams(window.location.search)
    if(!params.has('code')) throw new Error("No `code` param set in URL")
    const code = params.get('code')

    // To authenticate with Firebase, we POST the invite code to the 
    // backend API. It will return a custom Firebase authentication token.
    // Using that authentication token, we can sign into Firebase.
    const res = await fetch(`/api/auth/beta?code=${code}`)
        .then(res => res.json())
    if(res.error) {
        throw new Error(res.error)
    }

    try {
        const auth = await firebase.auth().signInWithCustomToken(res.token)
        const token = await auth.user.getIdToken()
        console.debug(`Setting Firebase token to ${token}`)
        // For later calls to the backend, we use the `token` cookie as a session cookie.
        // It will be used to identify the user using the Firebase API.
        document.cookie = `token=${token}; path=/`

    } catch(error) {
        throw new Error("Error signing in with Firebase: " + error.code + ' ' + error.message)
    }
}


const SignUp = () => {
    const [authenticate, state] = usePromiseLoadingStateWithError(_authenticate)

    useEffect(() => {
        authenticate()
    }, [])

    return <Box p={5}>
        <Heading>Setting up your account...</Heading>
        { state.status == 'loading' && <CircularProgress isIndeterminate size="sm" color="green"/> }
        { state.status == 'ok' && <>
            <Button size="md" onClick={() => {
                window.location = '/'
            }}>Go to T1 Gym</Button>
        </>}
        { state.status == 'error' && <>
            There was an error while authenticating - {state.error.toString()}
        </>}
    </Box>
}

export default () => {
    return <ThemeProvider>
        <CSSReset />
        <SignUp/>
    </ThemeProvider>
}