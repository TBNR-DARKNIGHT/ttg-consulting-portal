import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@/styles/globals.css';

const failedPreloadKey = 'vite-preload-reload';

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();

  const failedUrl =
    event instanceof CustomEvent && event.payload instanceof Error
      ? event.payload.message
      : 'unknown';

  if (sessionStorage.getItem(failedPreloadKey) === failedUrl) {
    return;
  }

  sessionStorage.setItem(failedPreloadKey, failedUrl);
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
