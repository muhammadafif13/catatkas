import { useState } from 'react';
import { CloudOff, RefreshCw, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useAuthStore } from '../../stores/useAuthStore';
import { syncAndRefresh } from '../../services/sync';
import { toast } from '../../stores/useUIStore';
import { getErrorMessage } from '../../utils/helpers';

export default function ConnectionBanner() {
  const online = useOnlineStatus();
  const syncError = useAuthStore((state) => state.syncError);
  const user = useAuthStore((state) => state.user);
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    if (!user) return;
    setRetrying(true);
    try {
      await syncAndRefresh(user.id);
      useAuthStore.getState().setSyncError(null);
      toast.success('Data berhasil disinkronkan.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRetrying(false);
    }
  };

  if (!online) {
    return (
      <div className="connection-banner connection-banner--offline" role="status">
        <WifiOff size={17} aria-hidden="true" />
        <span>
          <strong>Mode offline.</strong> Kamu dapat membaca data, tetapi perubahan dinonaktifkan
          sampai internet kembali.
        </span>
      </div>
    );
  }

  if (syncError) {
    return (
      <div className="connection-banner connection-banner--warning" role="status">
        <CloudOff size={17} aria-hidden="true" />
        <span>
          <strong>Sinkronisasi tertunda.</strong> {syncError}
        </span>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={retry}
          disabled={retrying}
        >
          <RefreshCw size={14} aria-hidden="true" />
          {retrying ? 'Menyinkronkan…' : 'Coba lagi'}
        </button>
      </div>
    );
  }

  return null;
}
