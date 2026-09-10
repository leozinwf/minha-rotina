import React from 'react'
import { createRoot } from 'react-dom/client'
import AppV5 from './AppV5'
import './timeline-enhancer.css'
import './timeline-enhancer'

createRoot(document.getElementById('root')).render(<React.StrictMode><AppV5 /></React.StrictMode>)
