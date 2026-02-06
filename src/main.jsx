import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async';

import { Buffer } from 'buffer';
window.Buffer = Buffer;

import './index.css'
import './lib/i18n'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)
