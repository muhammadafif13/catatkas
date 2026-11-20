import { getSupabase } from '../lib/supabase';

async function readFunctionError(error, fallback) {
  let message = error?.message || fallback;
  try {
    const body = await error?.context?.json();
    if (body?.error) message = body.error;
  } catch {
    // Keep the invocation error message.
  }
  return message;
}

export async function requestAccountDeletion() {
  const { data, error } = await getSupabase().functions.invoke('delete-account', {
    method: 'POST',
  });

  if (error) {
    throw new Error(await readFunctionError(error, 'Gagal menghapus akun.'));
  }
  if (data?.error) throw new Error(data.error);
  return true;
}
