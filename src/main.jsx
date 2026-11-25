import '@fontsource/outfit/900.css'
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/app/App.jsx';
import '@/shared/styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
