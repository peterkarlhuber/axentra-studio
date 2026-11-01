import '@fontsource-variable/inter';
import '@fontsource-variable/manrope';
import '@fontsource-variable/jetbrains-mono';
import './styles/global.css';
import './i18n';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configureApi } from './api/client';
import { loadRuntimeConfig } from './api/config';
import { App } from './app/App';

const config = await loadRuntimeConfig();
configureApi({ baseUrl: config.apiBaseUrl });

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
