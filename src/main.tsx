import '@/styles/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { applyStoredMotion } from '@/lib/motion';
import { App } from './App.tsx';

// Apply a stored motion override before the first paint, not after the first effect.
applyStoredMotion();

const root = document.getElementById('root');
if (!root) throw new Error('missing #root');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
