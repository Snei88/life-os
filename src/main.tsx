import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';
import { AuthProvider } from './hooks/useAuth.tsx';
import { ThemeProvider } from './hooks/useTheme.tsx';

// Prevenir que extensiones modifiquen el DOM
document.documentElement.setAttribute('translate', 'no');
document.documentElement.classList.add('notranslate');
document.body.setAttribute('data-gramm', 'false'); // Grammarly
document.body.setAttribute('data-gramm_editor', 'false');
document.body.setAttribute('data-lt-installed', 'true'); // LanguageTool
document.body.setAttribute('translate', 'no');
document.body.classList.add('notranslate');
document.getElementById('root')?.setAttribute('translate', 'no');
document.getElementById('root')?.classList.add('notranslate');

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
