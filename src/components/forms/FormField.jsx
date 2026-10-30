import { classNames } from '../../utils/helpers';

export default function FormField({
  label,
  htmlFor,
  error,
  hint,
  optional = false,
  full = false,
  children,
  className,
}) {
  return (
    <div className={classNames('field', error && 'field--error', full && 'form-grid__full', className)}>
      {label ? (
        <div className="field__label-row">
          <label className="field__label" htmlFor={htmlFor}>
            {label}
          </label>
          {optional ? <span className="field__optional">Opsional</span> : null}
        </div>
      ) : null}
      {children}
      {error ? (
        <div className="field__error" role="alert">
          {error}
        </div>
      ) : null}
      {!error && hint ? <div className="field__hint">{hint}</div> : null}
    </div>
  );
}
