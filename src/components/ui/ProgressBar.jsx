import { clamp, classNames } from '../../utils/helpers';

function getProgressStatus(percentage) {
  if (percentage > 100) return 'over';
  if (percentage >= 80) return 'danger';
  if (percentage >= 60) return 'warning';
  return 'safe';
}

export default function ProgressBar({ value, status, size = 'md', label }) {
  const percentage = Math.max(0, Number(value) || 0);
  const resolvedStatus = status || getProgressStatus(percentage);

  return (
    <div
      className={classNames('progress', size === 'sm' && 'progress--sm')}
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `Progres ${Math.round(percentage)}%`}
    >
      <span
        className={`progress__bar progress__bar--${resolvedStatus}`}
        style={{ width: `${clamp(percentage, 0, 100)}%` }}
      />
    </div>
  );
}
