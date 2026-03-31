import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Import all CSS files in correct order
import './index.css'
import './styles/globals.css'
import './styles/design-system.css'
import './styles/home-animations.css'
import './styles/ux-polish.css'
import './App.css'

import App from './App.tsx'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
