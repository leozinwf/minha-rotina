import React from 'react'
import { createRoot } from 'react-dom/client'
import AppV6 from './AppV6'
import { enableTimelineCurrentTime } from './timeline-now'

createRoot(document.getElementById('root')).render(<React.StrictMode><AppV6 /></React.StrictMode>)

enableTimelineCurrentTime()
