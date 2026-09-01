import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FirebaseProvider } from './components/FirebaseProvider';
import { ErrorBoundary } from './components/ErrorBoundary';

// In development or preview iframes, unregister service workers to avoid stale bundle caching issues
try {
  if ('serviceWorker' in navigator) {
    const isIframe = window.self !== window.top;
    const isDevEnv = window.location.hostname.includes('ais-dev') || window.location.hostname.includes('localhost');
    
    if (isIframe || isDevEnv) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    } else {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('Fortunes Edutech PWA Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('Fortunes Edutech PWA Service Worker registration failed:', error);
          });
      });
    }
  }
} catch (e) {
  console.warn('Service worker registration API is not accessible:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <FirebaseProvider>
        <App />
      </FirebaseProvider>
    </ErrorBoundary>
  </StrictMode>,
);

