import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { queryClient } from './services/queryClient.js';
import './styles/index.css';

const Router = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router>
        <App />
      </Router>
    </QueryClientProvider>
  </React.StrictMode>,
);
