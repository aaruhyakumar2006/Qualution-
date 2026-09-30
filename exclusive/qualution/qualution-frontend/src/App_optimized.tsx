import React, { useState } from 'react';
import { IDEPageOptimized } from './pages/IDEPageOptimized';
import { ThemeProvider } from './features/theme/ThemeContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import type { CircuitRequest } from './features/circuit/types';

export interface AppProps {
  initialCircuit?: CircuitRequest;
}

/**
 * OPTIMIZED Qualution IDE App - Lightweight version for testing
 * Use this for performance testing with large circuits (42+ qubits)
 */
export const App: React.FC<AppProps> = ({ initialCircuit }) => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <div className="app">
          <IDEPageOptimized />
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

App.displayName = 'AppOptimized';
