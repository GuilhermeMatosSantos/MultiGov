import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  erro: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: null };

  static getDerivedStateFromError(erro: Error): State {
    return { erro };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error("Erro apanhado pelo limite de erro:", erro, info.componentStack);
  }

  render() {
    const { erro } = this.state;
    if (!erro) return this.props.children;

    return (
      <div className="error-boundary">
        <div className="error-boundary-card">
          <span className="error-boundary-icon">⚠️</span>
          <h1>Ocorreu um erro inesperado</h1>
          <p>
            Algo correu mal nesta página. Os teus dados continuam guardados neste browser, tenta recarregar.
            Se o erro persistir depois de recarregar, é provável que os dados guardados estejam desatualizados
            face à versão atual da aplicação.
          </p>
          <details className="error-boundary-details">
            <summary>Detalhes técnicos</summary>
            <pre>{erro.message}</pre>
          </details>
          <div className="error-boundary-actions">
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Recarregar a página
            </button>
            <button className="btn btn-ghost" onClick={() => this.setState({ erro: null })}>
              Tentar continuar sem recarregar
            </button>
          </div>
        </div>
      </div>
    );
  }
}
