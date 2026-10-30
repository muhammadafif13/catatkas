import { Component } from 'react';
import FatalError from './FatalError';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught application error', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <FatalError
          title="Terjadi kesalahan tak terduga"
          message="Data kamu tetap aman. Muat ulang halaman untuk melanjutkan."
          details={this.state.error.message}
          onRetry={() => window.location.reload()}
        />
      );
    }

    return this.props.children;
  }
}
