import { create } from 'zustand';
import { isOnline, isSupabaseConfigured, supabase } from '../lib/supabase';
import { clearCache, prepareCacheForUser } from '../db/cache';
import { profileFromRow } from '../services/mappers';
import { refreshDataStores, syncUserData } from '../services/sync';
import { resetDataStores } from './resetDataStores';

const PROFILE_CACHE_KEY = 'catatkas.profile.v2';
let hydrateGeneration = 0;
let initializePromise = null;
let authSubscription = null;

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function cacheProfile(profile) {
  if (!profile) return;
  try {
    window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch {
    // Local profile cache is optional.
  }
}

function readCachedProfile(userId) {
  try {
    const cached = JSON.parse(window.localStorage.getItem(PROFILE_CACHE_KEY) || 'null');
    return cached?.id === userId ? cached : null;
  } catch {
    return null;
  }
}

function clearCachedProfile() {
  try {
    window.localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    // Local profile cache is optional.
  }
}

export function authErrorMessage(error) {
  const message = String(error?.message || error || '');
  if (/invalid login credentials/i.test(message)) return 'Email atau password salah.';
  if (/email not confirmed/i.test(message)) {
    return 'Email akun ini belum dikonfirmasi. Hubungi admin CatatKas.';
  }
  if (/user.*banned|banned.*user|user.*blocked/i.test(message)) {
    return 'Akun ini sedang ditangguhkan. Hubungi admin CatatKas.';
  }
  if (/user already registered/i.test(message)) return 'Email ini sudah terdaftar.';
  if (/password should be at least/i.test(message)) {
    return 'Password minimal 8 karakter.';
  }
  if (/too many requests|rate limit/i.test(message)) {
    return 'Terlalu banyak percobaan. Tunggu beberapa saat lalu coba lagi.';
  }
  if (/invalid email/i.test(message)) return 'Format email tidak valid.';
  if (/network|failed to fetch/i.test(message)) {
    return 'Tidak dapat menghubungi server. Periksa koneksi internet.';
  }
  return message || 'Terjadi kesalahan. Coba lagi.';
}

async function fetchProfile(userId) {
  const client = supabase;
  let lastError = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) return profileFromRow(data);
    lastError = error;
    if (!isOnline()) break;
    await wait(350 * (attempt + 1));
  }

  if (lastError) throw new Error(authErrorMessage(lastError));
  throw new Error('Profil akun tidak ditemukan. Hubungi admin CatatKas.');
}

async function touchLastSeen(userId) {
  try {
    await supabase
      .from('profiles')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', userId);
  } catch {
    // Presence is non-critical.
  }
}

async function hydrate(session) {
  const generation = ++hydrateGeneration;
  const user = session?.user;

  if (!user) {
    useAuthStore.setState({
      status: 'unauthenticated',
      session: null,
      user: null,
      profile: null,
    });
    return;
  }

  const current = useAuthStore.getState();
  const isSameUser = current.status === 'authenticated' && current.profile?.id === user.id;
  if (!isSameUser) {
    useAuthStore.setState({ status: 'loading', error: null, syncError: null, session, user });
  }

  try {
    await prepareCacheForUser(user.id);

    let profile = null;
    let profileFromServer = false;

    if (isOnline()) {
      profile = await fetchProfile(user.id);
      profileFromServer = true;
    } else {
      profile = readCachedProfile(user.id) || current.profile;
    }

    if (generation !== hydrateGeneration) return;
    if (!profile) {
      throw new Error(
        'Profil belum tersedia di perangkat ini. Sambungkan internet sekali untuk membuka akun.',
      );
    }

    cacheProfile(profile);

    if (profile.isSuspended) {
      clearCachedProfile();
      await clearCache();
      resetDataStores();
      if (generation !== hydrateGeneration) return;
      useAuthStore.setState({
        status: 'suspended',
        session,
        user,
        profile,
        error: 'Akun ini sedang ditangguhkan oleh admin.',
      });
      return;
    }

    let syncError = null;
    if (isOnline()) {
      try {
        await syncUserData(user.id);
      } catch (error) {
        syncError = authErrorMessage(error);
      }
      if (profileFromServer) void touchLastSeen(user.id);
    }

    if (generation !== hydrateGeneration) return;

    useAuthStore.setState({ session, user, profile, syncError, error: null });
    await refreshDataStores();

    if (generation !== hydrateGeneration) return;
    useAuthStore.setState({ status: 'authenticated' });
  } catch (error) {
    if (generation !== hydrateGeneration) return;

    const cachedProfile = readCachedProfile(user.id);
    if (cachedProfile && !isOnline()) {
      useAuthStore.setState({
        status: 'authenticated',
        session,
        user,
        profile: cachedProfile,
        error: null,
        syncError: 'Mode offline: perubahan data dinonaktifkan.',
      });
      await refreshDataStores();
      return;
    }

    useAuthStore.setState({
      status: 'auth_error',
      session,
      user,
      profile: cachedProfile,
      error: authErrorMessage(error),
    });
  }
}

async function clearLocalSession() {
  hydrateGeneration += 1;
  clearCachedProfile();
  resetDataStores();
  await clearCache().catch(() => {});
  useAuthStore.setState({
    status: 'unauthenticated',
    session: null,
    user: null,
    profile: null,
    error: null,
    syncError: null,
  });
}

export const useAuthStore = create((set, get) => ({
  status: isSupabaseConfigured ? 'loading' : 'unconfigured',
  session: null,
  user: null,
  profile: null,
  error: null,
  syncError: null,

  initialize: async () => {
    if (!isSupabaseConfigured) {
      set({ status: 'unconfigured' });
      return;
    }
    if (initializePromise) return initializePromise;

    initializePromise = (async () => {
      if (!authSubscription) {
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'INITIAL_SESSION') return;

          if (event === 'SIGNED_OUT') {
            void clearLocalSession();
            return;
          }

          if (event === 'TOKEN_REFRESHED') {
            set({ session });
            return;
          }

          if (session?.user) {
            void hydrate(session);
          }
        });
        authSubscription = data.subscription;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        set({ status: 'auth_error', error: authErrorMessage(error) });
        return;
      }

      if (data.session) {
        await hydrate(data.session);
      } else {
        set({ status: 'unauthenticated' });
      }
    })();

    return initializePromise;
  },

  setSyncError: (syncError) => set({ syncError }),

  retry: async () => {
    set({ status: 'loading', error: null });
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      set({ status: 'auth_error', error: authErrorMessage(error) });
      return;
    }
    if (!data.session) {
      set({ status: 'unauthenticated' });
      return;
    }
    await hydrate(data.session);
  },

  refreshProfile: async () => {
    const { user, status } = get();
    if (!user || !isOnline() || !['authenticated', 'suspended'].includes(status)) return;

    try {
      const profile = await fetchProfile(user.id);
      cacheProfile(profile);

      if (profile.isSuspended) {
        clearCachedProfile();
        await clearCache();
        resetDataStores();
        set({
          status: 'suspended',
          profile,
          error: 'Akun ini sedang ditangguhkan oleh admin.',
        });
        return;
      }

      set({ profile, status: 'authenticated', error: null });
      void touchLastSeen(user.id);
    } catch {
      // Keep the last known profile when the network or server is unavailable.
    }
  },

  signIn: async (email, password) => {
    if (!isSupabaseConfigured) throw new Error('Supabase belum dikonfigurasi.');
    const { error } = await supabase.auth.signInWithPassword({
      email: String(email || '').trim(),
      password,
    });
    if (error) throw new Error(authErrorMessage(error));
  },

  signUp: async ({ fullName, email, password }) => {
    if (!isSupabaseConfigured) throw new Error('Supabase belum dikonfigurasi.');
    const emailAddress = String(email || '').trim();
    const { data, error } = await supabase.auth.signUp({
      email: emailAddress,
      password,
      options: {
        data: { full_name: String(fullName || '').trim() },
      },
    });
    if (error) throw new Error(authErrorMessage(error));
    if (!data.session) {
      throw new Error(
        'Pendaftaran berhasil, tetapi sesi login tidak terbentuk. Pastikan Confirm Email dinonaktifkan di Supabase.',
      );
    }

    await supabase.auth.signOut({ scope: 'local' });
    await clearLocalSession();
    return { email: emailAddress };
  },

  requestPasswordReset: async (email) => {
    if (!isSupabaseConfigured) throw new Error('Supabase belum dikonfigurasi.');
    const { error } = await supabase.auth.resetPasswordForEmail(String(email || '').trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(authErrorMessage(error));
  },

  updatePassword: async (password) => {
    if (!isSupabaseConfigured) throw new Error('Supabase belum dikonfigurasi.');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(authErrorMessage(error));
  },

  signOut: async () => {
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    await clearLocalSession();
  },
}));
