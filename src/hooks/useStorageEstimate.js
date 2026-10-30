import { useEffect, useState } from 'react';

export function useStorageEstimate() {
  const [estimate, setEstimate] = useState({ usage: null, quota: null, supported: false });

  useEffect(() => {
    let active = true;

    if (!navigator.storage?.estimate) {
      setEstimate({ usage: null, quota: null, supported: false });
      return undefined;
    }

    navigator.storage
      .estimate()
      .then(({ usage, quota }) => {
        if (active) setEstimate({ usage, quota, supported: true });
      })
      .catch(() => {
        if (active) setEstimate({ usage: null, quota: null, supported: false });
      });

    return () => {
      active = false;
    };
  }, []);

  return estimate;
}
