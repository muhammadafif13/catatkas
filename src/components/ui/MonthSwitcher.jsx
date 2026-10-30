import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonth, getCurrentPeriod, shiftMonth } from '../../utils/formatDate';

export default function MonthSwitcher({ value, onChange, allowFuture = false, label }) {
  const atCurrent = value >= getCurrentPeriod();
  const previous = () => onChange(shiftMonth(value, -1));
  const next = () => {
    if (!allowFuture && atCurrent) return;
    onChange(shiftMonth(value, 1));
  };

  return (
    <div className="month-switcher">
      <button
        type="button"
        className="month-switcher__btn"
        onClick={previous}
        aria-label="Bulan sebelumnya"
      >
        <ChevronLeft aria-hidden="true" />
      </button>
      <div>
        <div className="month-switcher__label">{formatMonth(value)}</div>
        {label ? <div className="text-xs text-tertiary">{label}</div> : null}
      </div>
      <button
        type="button"
        className="month-switcher__btn"
        onClick={next}
        disabled={!allowFuture && atCurrent}
        aria-label="Bulan berikutnya"
      >
        <ChevronRight aria-hidden="true" />
      </button>
    </div>
  );
}
