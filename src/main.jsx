import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { dismissBootSplash } from './bootSplash';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

const dismissWhenReady = () => {
  window.requestAnimationFrame(() => dismissBootSplash());
};

if (document.fonts?.ready) {
  Promise.race([
    document.fonts.ready,
    new Promise((resolve) => {
      window.setTimeout(resolve, 2500);
    }),
  ]).then(dismissWhenReady);
} else {
  dismissWhenReady();
}
