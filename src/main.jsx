import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SgrApp from './SgrApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SgrApp />
  </StrictMode>,
)
