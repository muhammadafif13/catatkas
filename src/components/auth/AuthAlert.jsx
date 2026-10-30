import { AlertCircle, CheckCircle2, MailCheck } from 'lucide-react';

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: MailCheck,
};

export default function AuthAlert({ type = 'error', title, children }) {
  const Icon = icons[type] || AlertCircle;
  return (
    <div className={`auth-alert auth-alert--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={19} aria-hidden="true" />
      <div>
        {title ? <strong>{title}</strong> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
