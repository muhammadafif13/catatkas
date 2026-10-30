import { TriangleAlert } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import Modal from './Modal';

export default function ConfirmDialog() {
  const confirmState = useUIStore((state) => state.confirmState);
  const resolveConfirm = useUIStore((state) => state.resolveConfirm);

  const close = () => resolveConfirm(false);

  return (
    <Modal
      open={Boolean(confirmState)}
      title={confirmState?.title}
      onClose={close}
      size="sm"
      actions={
        <>
          <button type="button" className="btn btn--ghost" onClick={close}>
            {confirmState?.cancelLabel || 'Batal'}
          </button>
          <button
            type="button"
            className={confirmState?.danger ? 'btn btn--danger' : 'btn btn--primary'}
            onClick={() => resolveConfirm(true)}
          >
            {confirmState?.confirmLabel || 'Ya, lanjutkan'}
          </button>
        </>
      }
    >
      <div className="callout callout--danger">
        <TriangleAlert size={18} aria-hidden="true" />
        <span>{confirmState?.message}</span>
      </div>
    </Modal>
  );
}
