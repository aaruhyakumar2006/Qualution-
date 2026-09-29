import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App_optimized';
import './index.css';

/**
 * OPTIMIZED Entry point for Qualution IDE
 * Lightweight version for large circuit performance testing
 */

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
