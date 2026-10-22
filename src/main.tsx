import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FirebaseProvider } from './components/FirebaseProvider';
import { ErrorBoundary } from './components/ErrorBoundary';

// Capture beforeinstallprompt globally so all components can access the native PWA install prompt
try {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as any).__deferredPwaPrompt = e;
    window.dispatchEvent(new CustomEvent('pwa-prompt-available'));
  });
} catch (e) {
  console.warn('Could not register beforeinstallprompt listener:', e);
}

// In preview iframes (such as Google AI Studio), avoid service worker operations completely
// as embedded/sandboxed iframes reject service worker registration with "The document is in an invalid state".
// Only register service workers when running in a standalone top-level secure window.
try {
  const isIframe = (() => {
    try {
      return window.self !== window.top || window.location.hostname.includes('aistudio.google.com');
    } catch {
      return true;
    }
  })();

  if (!isIframe && 'serviceWorker' in navigator && window.isSecureContext) {
    const registerSW = () => {
      try {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('Fortunes Edutech PWA Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            // Silently ignore or log warning without unhandled rejection
            console.warn('Fortunes Edutech PWA Service Worker registration failed:', error);
          });
      } catch (e) {
        console.warn('Service worker registration could not be started:', e);
      }
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW, { once: true });
    }
  }
} catch (e) {
  console.warn('Service worker check encountered an error:', e);
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

