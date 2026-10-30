import { Inbox } from 'lucide-react';
import { classNames } from '../../utils/helpers';

export default function EmptyState({ icon, title, text, action, compact = false }) {
  return (
    <div className={classNames('empty-state', compact && 'empty-state--compact')}>
      <div className="empty-state__icon" aria-hidden="true">
        {icon || <Inbox size={compact ? 22 : 28} />}
      </div>
      <div>
        <div className="empty-state__title">{title}</div>
        {text ? <p className="empty-state__text">{text}</p> : null}
      </div>
      {action ? <div className="empty-state__actions">{action}</div> : null}
    </div>
  );
}
