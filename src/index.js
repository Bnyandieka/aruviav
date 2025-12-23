import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Production security measures
if (process.env.NODE_ENV === 'production') {
  // Disable source maps (already set via .env)
  // Disable console
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  
  // Prevent DevTools
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
  
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J'))
    ) {
      e.preventDefault();
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);