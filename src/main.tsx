import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AgendaProvider } from './context/AgendaContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AgendaProvider>
        <App />
      </AgendaProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
