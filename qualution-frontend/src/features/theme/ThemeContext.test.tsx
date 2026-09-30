import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider, useTheme, THEME_STORAGE_KEY } from './ThemeContext';
import { Header } from '../../components/layout/Header';
import { App } from '../../App';

const TestThemeComponent: React.FC = () => {
  const { theme, setTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={() => setTheme('light')} data-testid="set-light">Set Light</button>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">Set Dark</button>
      <button onClick={toggleTheme} data-testid="toggle-theme">Toggle</button>
    </div>
  );
};

describe('ThemeContext & Theme Switching', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.className = '';
    vi.restoreAllMocks();
  });

  it('defaults to dark theme when localStorage is empty', () => {
    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('restores light theme from localStorage if previously saved', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');

    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme').textContent).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('falls back safely to dark theme when localStorage has an invalid value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'invalid-theme-value');

    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('switches theme and persists change to localStorage', () => {
    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByTestId('toggle-theme');

    // Switch to light
    act(() => {
      fireEvent.click(toggleBtn);
    });

    expect(screen.getByTestId('current-theme').textContent).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);

    // Switch back to dark
    act(() => {
      fireEvent.click(toggleBtn);
    });

    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('renders theme switcher in Header with accessible labels', () => {
    render(
      <ThemeProvider>
        <Header
          selectedBackend="qiskit_aer"
          onSelectBackend={vi.fn()}
          shots={1000}
          onChangeShots={vi.fn()}
          onRun={vi.fn()}
          executionStatus="idle"
          isDirty={false}
          isBackendReady={true}
          onOpenCommandPalette={vi.fn()}
          onOpenShortcuts={vi.fn()}
        />
      </ThemeProvider>
    );

    // Open hamburger menu
    const hamburgerBtn = screen.getByTestId('app-hamburger-btn');
    act(() => {
      fireEvent.click(hamburgerBtn);
    });

    const themeBtn = screen.getByTestId('theme-toggle-btn');
    expect(themeBtn).toBeInTheDocument();
    expect(themeBtn).toHaveTextContent('Switch to Light Theme');

    // Click toggle in menu
    act(() => {
      fireEvent.click(themeBtn);
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('renders complete App in light theme without runtime errors', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    const { container } = render(<App />);

    expect(container).toBeInTheDocument();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(screen.getByTestId('ide-page')).toBeInTheDocument();
  });
});
