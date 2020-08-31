import { ThemeProvider, CSSReset } from "@chakra-ui/core"
import { useState } from "react"
import { AppLoadingOverlay } from "../AppLoadingOverlay"
import { useEffect } from "react"
import { initialiseFirebase } from "../../misc/wrappers"

export const AppWrapper = ({ children }) => {
    const [loading, setLoading] = useState(true)
    
    async function initialize() {
        await initialiseFirebase()
        setLoading(false)
    }
    
    useEffect(() => {
        initialize()
    }, [])
    
    return <ThemeProvider>
        <CSSReset/>
        <AppLoadingOverlay show={loading}/>
        { !loading && children }
    </ThemeProvider>
}


