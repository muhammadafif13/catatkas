import { formatAmountInput, parseCurrencyInput } from '../../utils/formatCurrency';

export default function AmountInput({
  value,
  onChange,
  error = '',
  autoFocus = false,
  id = 'transaction-amount',
}) {
  return (
    <div className="field">
      <div className="field__label-row">
        <label className="field__label" htmlFor={id}>
          Jumlah
        </label>
        <span className="field__optional">Wajib</span>
      </div>
      <div className={`amount-field${error ? ' input--error' : ''}`}>
        <span className="amount-field__prefix">Rp</span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          className="amount-field__input"
          placeholder="0"
          value={formatAmountInput(value)}
          onChange={(event) => onChange(parseCurrencyInput(event.target.value))}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      </div>
      {error ? (
        <div className="field__error" id={`${id}-error`} role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}
