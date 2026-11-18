import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/styles/index.css'
import { StudioRoot } from './StudioRoot.jsx'

createRoot(document.getElementById('root')).render(<StrictMode><StudioRoot/></StrictMode>)
