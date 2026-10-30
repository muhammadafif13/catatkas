import { classNames } from '../../utils/helpers';

export default function StatCard({ icon, label, value, meta, variant = 'primary' }) {
  return (
    <div className={classNames('stat-card', `stat-card--${variant}`)}>
      <span className="stat-card__icon" aria-hidden="true">
        {icon}
      </span>
      <div className="stat-card__body">
        <div className="stat-card__label">{label}</div>
        <div className="stat-card__value">{value}</div>
        {meta ? <div className="stat-card__meta">{meta}</div> : null}
      </div>
    </div>
  );
}
