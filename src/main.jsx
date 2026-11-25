import React, { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class SimpleErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Invori Studio Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f4efea',
          color: '#2a3125',
          fontFamily: 'var(--font-body)',
          padding: '24px',
          textAlign: 'center'
        }}>
          <h2 className="serif-italic" style={{ fontSize: '2rem', marginBottom: 12, color: 'var(--olive)' }}>
            Something Went Wrong
          </h2>
          <p style={{ maxWidth: 440, color: 'var(--text-muted)', marginBottom: 16, fontSize: 14 }}>
            We encountered an unexpected rendering issue. Please reload the page or contact support if the problem persists.
          </p>
          {this.state.error?.message && (
            <p style={{ fontSize: 12, color: '#b91c1c', marginBottom: 20, maxWidth: 500, background: 'rgba(185, 28, 28, 0.08)', padding: '8px 14px', borderRadius: 6 }}>
              {this.state.error.message}
            </p>
          )}
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary"
            style={{ padding: '12px 28px' }}
          >
            Reload Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SimpleErrorBoundary>
      <App />
    </SimpleErrorBoundary>
  </StrictMode>,
)
