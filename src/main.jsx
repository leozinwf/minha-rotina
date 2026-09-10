import React from 'react'
import { createRoot } from 'react-dom/client'
import AppV6 from './AppV6'
import AuthGate from './AuthGate'
import TaskInbox from './TaskInbox'
import { enableTimelineCurrentTime } from './timeline-now'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthGate>
      <AppV6 />
      <TaskInbox />
    </AuthGate>
  </React.StrictMode>
)

enableTimelineCurrentTime()
