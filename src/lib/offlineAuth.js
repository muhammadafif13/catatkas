const ID_KEY = 'catatkas.offlineIdentity.v1';

export function saveOfflineIdentity({ userId, email = '', fullName = '', role = 'user' }) {
  try {
    window.localStorage.setItem(
      ID_KEY,
      JSON.stringify({ userId, email, fullName, role, savedAt: Date.now() }),
    );
  } catch {
    // Ignore storage errors
  }
}

export function readOfflineIdentity() {
  try {
    const raw = window.localStorage.getItem(ID_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearOfflineIdentity() {
  try {
    window.localStorage.removeItem(ID_KEY);
  } catch {
    // Ignore
  }
}
