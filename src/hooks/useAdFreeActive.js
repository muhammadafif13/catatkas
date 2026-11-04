import { useEffect, useState } from 'react';
import { useAdMobStore } from '../stores/useAdMobStore';

export function useAdFreeActive() {
  const adFreeUntil = useAdMobStore((state) => state.adFreeUntil);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (adFreeUntil <= Date.now()) return undefined;
    const timeout = window.setTimeout(
      () => setTick((value) => value + 1),
      adFreeUntil - Date.now() + 100,
    );
    return () => window.clearTimeout(timeout);
  }, [adFreeUntil]);

  return adFreeUntil > Date.now();
}
