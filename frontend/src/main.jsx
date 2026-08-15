import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />

    <Toaster
      position="top-right"
      theme="dark"
      richColors
      closeButton
      expand={false}
      duration={4500}
      visibleToasts={4}
      gap={10}
      offset={20}
      toastOptions={{
        style: {
          background:
            'linear-gradient(135deg, rgba(18, 12, 8, 0.98), rgba(35, 20, 12, 0.98))',
          color: '#ffffff',
          border:
            '1px solid rgba(245, 163, 0, 0.35)',
          borderRadius: '16px',
          boxShadow:
            '0 18px 50px rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(18px)',
        },
      }}
    />
  </StrictMode>,
)