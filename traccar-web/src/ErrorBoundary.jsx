import React from 'react';
import { Alert } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div style={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: '#0f172a', 
          color: '#f8fafc',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div>
            <h1 style={{ color: '#ef4444' }}>Something went wrong</h1>
            <p>The application encountered an unexpected error.</p>
            <Alert severity="error" sx={{ textAlign: 'left', mt: 4, borderRadius: '12px' }}>
              <code style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>{error.message}</code>
            </Alert>
            <button 
              onClick={() => window.location.reload()}
              style={{
                marginTop: '2rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: '#38bdf8',
                color: '#0f172a',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    const { children } = this.props;
    return children;
  }
}

export default ErrorBoundary;
