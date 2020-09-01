import React from 'react'
import {addDecorator} from '@storybook/react'
import {ThemeProvider, CSSReset} from '@chakra-ui/core'

// Add a global story decorator to include styles from Chakra UI.
// See: https://storybook.js.org/docs/react/writing-stories/decorators#global-decorators
addDecorator((storyFn) => (
  <ThemeProvider>
    <CSSReset />
    {storyFn()}
  </ThemeProvider>
))