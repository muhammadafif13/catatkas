import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function PasswordInput({ id, value, onChange, placeholder = '••••••••', ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="input-wrap auth-password">
      <Lock aria-hidden="true" />
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        className="input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={props.autoComplete || 'current-password'}
        required
        minLength={8}
        {...props}
      />
      <button
        type="button"
        className="auth-password__toggle"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
