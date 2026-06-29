import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AppProvider } from './state/AppContext.tsx';
import { PlanProvider } from './features/PlanContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlanProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </PlanProvider>
  </StrictMode>,
);
