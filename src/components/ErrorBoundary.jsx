import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 24, fontFamily: 'monospace', fontSize: 14,
          background: '#fef2f2', color: '#dc2626', minHeight: '100dvh',
          whiteSpace: 'pre-wrap', wordBreak: 'break-all'
        }}>
          <strong>Erreur :</strong>{'\n\n'}
          {this.state.error.message}{'\n\n'}
          {this.state.error.stack}
          <br /><br />
          <button onClick={() => this.setState({ error: null })}
            style={{ padding: '12px 24px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer' }}>
            Réessayer
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
