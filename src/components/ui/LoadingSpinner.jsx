import { classNames } from '../../utils/helpers';

export default function LoadingSpinner({ label = 'Memuat…', block = false, size = 'md' }) {
  return (
    <div
      className={classNames('loading-inline', block && 'loading-block')}
      role="status"
      aria-live="polite"
    >
      <span className={classNames('spinner', size === 'sm' && 'spinner--sm')} aria-hidden="true" />
      {label ? <span className="text-xs text-muted">{label}</span> : <span className="sr-only">Memuat</span>}
    </div>
  );
}
