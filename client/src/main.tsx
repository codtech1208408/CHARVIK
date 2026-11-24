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

// Prevent accidental zooming (pinch-to-zoom, double-tap zoom, Ctrl+wheel, Ctrl+/-) to keep the screen fixed
if (typeof window !== 'undefined') {
  // Prevent Ctrl+Wheel / trackpad pinch zoom
  window.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Prevent keyboard zoom (Ctrl + '+', '-', '0', '=')
  window.addEventListener('keydown', (e) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')
    ) {
      e.preventDefault();
    }
  });

  // Prevent multi-touch pinch zoom
  document.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Prevent double-tap zoom
  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    },
    { passive: false }
  );

  // Prevent WebKit / Safari gesture zooming
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((event) => {
    document.addEventListener(event, (e) => {
      e.preventDefault();
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="Charvik Fleet Management System">
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

