import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './app/App'
import { initTheme } from '@chemtools/shared/store/themeStore'
import '@chemtools/shared/styles.css'

// Restore theme before first paint to avoid flash
initTheme()

// One-time migration: move old reagent_templates key into zustand persist key
;(function migrateTemplates() {
  const OLD_KEY = 'reagent_templates'
  const NEW_KEY = 'reagent-templates'
  try {
    if (localStorage.getItem(NEW_KEY)) return // already migrated
    const old = localStorage.getItem(OLD_KEY)
    if (!old) return
    const arr = JSON.parse(old)
    if (Array.isArray(arr) && arr.length > 0) {
      localStorage.setItem(NEW_KEY, JSON.stringify({ state: { templates: arr, activeId: arr[0]?.id ?? '' }, version: 0 }))
      localStorage.removeItem(OLD_KEY)
    }
  } catch { /* ignore */ }
})()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
