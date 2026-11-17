import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx'

// Handle dynamic Vite bundle updates on Vercel deployments seamlessly without white screen
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error (new deployment or stale chunk). Reloading page...', event);
  window.location.reload();
});

window.addEventListener('error', (event) => {
  if (event?.message && event.message.includes('Failed to fetch dynamically imported module')) {
    console.warn('Stale module chunk error detected, reloading to fetch latest version...');
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="Charvik Fleet Management System">
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

