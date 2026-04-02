import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';
import { AuthProvider } from './hooks/useAuth.tsx';
import { ThemeProvider } from './hooks/useTheme.tsx';

// Prevenir que extensiones modifiquen el DOM
document.body.setAttribute('data-gramm', 'false'); // Grammarly
document.body.setAttribute('data-gramm_editor', 'false');
document.body.setAttribute('data-lt-installed', 'true'); // LanguageTool

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);