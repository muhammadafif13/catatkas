import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function FatalError({
  title = 'Aplikasi gagal dimuat',
  message,
  details,
  onRetry,
  secondaryAction,
}) {
  return (
    <div className="fatal-screen">
      <div className="fatal-screen__card" role="alert">
        <div className="fatal-screen__icon">
          <AlertTriangle size={30} aria-hidden="true" />
        </div>
        <div>
          <h1 className="fatal-screen__title">{title}</h1>
          <p className="fatal-screen__message">
            {message || 'Terjadi kesalahan saat membuka database lokal. Coba muat ulang aplikasi.'}
          </p>
        </div>
        {details ? <pre className="fatal-screen__details">{details}</pre> : null}
        <div className="fatal-screen__actions">
          {onRetry ? (
            <button type="button" className="btn btn--primary btn--block" onClick={onRetry}>
              <RefreshCw aria-hidden="true" />
              Coba Lagi
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={() => window.location.reload()}
            >
              <RefreshCw aria-hidden="true" />
              Muat Ulang
            </button>
          )}
          {secondaryAction ? (
            <button
              type="button"
              className="btn btn--ghost btn--block"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
