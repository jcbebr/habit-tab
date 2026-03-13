import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/charts/styles.css'
import '@mantine/notifications/styles.css'
import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import './index.css'
import App from './App.tsx'

const theme = createTheme({
  fontFamily: 'Inter, system-ui, sans-serif',
  primaryColor: 'violet',
  defaultRadius: 'md',
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="light" theme={theme}>
      <Notifications position="top-right" />
      <App />
    </MantineProvider>
  </StrictMode>,
)
