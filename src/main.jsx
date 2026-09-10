import React from 'react'
import { createRoot } from 'react-dom/client'
import AppV6 from './AppV6'
import AuthGate from './AuthGate'
import { enableTimelineCurrentTime } from './timeline-now'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthGate>
      <AppV6 />
    </AuthGate>
  </React.StrictMode>
)

enableTimelineCurrentTime()
