import '@fontsource-variable/inter';
import '@fontsource-variable/manrope';
import '@fontsource-variable/jetbrains-mono';
import './styles/global.css';
import { i18nReady } from './i18n';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configureApi } from './api/client';
import { loadRuntimeConfig } from './api/config';
import { App } from './app/App';
import { captureInvitationFromAddressBar } from './features/tenants/invitationLink';

// An invitation token leaves the address bar before anything else runs (no history entry,
// no Referer, not in the sign-in page URL); the tab keeps it for the accept page.
captureInvitationFromAddressBar();

const [config] = await Promise.all([loadRuntimeConfig(), i18nReady]);
configureApi({ baseUrl: config.apiBaseUrl });

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
