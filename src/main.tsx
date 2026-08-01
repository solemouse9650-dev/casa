import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/index.css'
import App from '@/App'
import { firebaseReady } from '@/firebase/config'
import { ConfigError } from '@/components/ConfigError'

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100dvh',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            background: '#f7f4ef',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ maxWidth: 480 }}>
            <h1>Error al cargar Casa</h1>
            <p style={{ color: '#5c6b66' }}>{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => window.location.assign('/login')}
              style={{
                marginTop: 16,
                padding: '10px 16px',
                borderRadius: 12,
                border: 0,
                background: '#1b7a6e',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Ir al login
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const root = document.getElementById('root')

if (!root) {
  document.body.textContent = 'No se encontró #root'
} else {
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary>
        {firebaseReady ? <App /> : <ConfigError />}
      </ErrorBoundary>
    </StrictMode>,
  )
}
