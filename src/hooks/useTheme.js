import { useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';

function resolveTheme(setting) {
  if (setting === 'system') {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return setting === 'light' ? 'light' : 'dark';
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#f8fafc');
}

export function useTheme() {
  const setting = useSettingsStore((state) => state.settings.theme);
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(setting || 'dark'));

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const update = () => {
      const theme = resolveTheme(setting || 'dark');
      setResolvedTheme(theme);
      applyTheme(theme);
    };

    update();
    if (setting === 'system' && media) {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }
    return undefined;
  }, [setting]);

  return { setting, resolvedTheme };
}
