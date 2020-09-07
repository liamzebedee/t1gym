import { ThemeProvider, CSSReset } from "@chakra-ui/core"
import { useState } from "react"
import { AppLoadingOverlay } from "../AppLoadingOverlay"
import { useEffect } from "react"
import { initialiseFirebase, authenticateFirebase } from "../../misc/wrappers"

export const AppWrapper = ({ authenticateUser = true, children }) => {
  const [loading, setLoading] = useState(true)

  async function initialize() {
    await initialiseFirebase()
    if (authenticateUser) await authenticateFirebase()
    setLoading(false)
  }

  useEffect(() => {
    initialize()
  }, [])

  return (
    <ThemeProvider>
      <CSSReset />
      <AppLoadingOverlay show={loading} />
      {!loading && children}
    </ThemeProvider>
  )
}
