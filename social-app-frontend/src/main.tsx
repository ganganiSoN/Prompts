import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import 'nprogress/nprogress.css'
import App from './App.tsx'
import NProgress from 'nprogress'

// Configure NProgress once globally
NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.1 });

// Intercept all native fetch calls globally to trigger the loading bar automatically
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  NProgress.start();
  try {
    const response = await originalFetch(...args);
    return response;
  } finally {
    NProgress.done();
  }
};

const googleClientId = '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';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
