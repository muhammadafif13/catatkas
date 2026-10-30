import { DatabaseZap, Terminal } from 'lucide-react';
import BrandMark from './BrandMark';

export default function SupabaseConfigScreen() {
  return (
    <div className="config-screen">
      <div className="config-screen__card">
        <div className="config-screen__icon">
          <DatabaseZap size={30} aria-hidden="true" />
        </div>
        <BrandMark size={46} decorative />
        <div>
          <h1>Supabase belum terhubung</h1>
          <p>
            CatatKas v2 membutuhkan URL dan anon key Supabase. Buat file <code>.env.local</code> di
            folder proyek, lalu isi dua variabel berikut.
          </p>
        </div>
        <pre className="config-screen__code">
          <code>{`VITE_SUPABASE_URL=https://proyekmu.supabase.co\nVITE_SUPABASE_ANON_KEY=anon-key-dari-dashboard`}</code>
        </pre>
        <div className="config-screen__hint">
          <Terminal size={16} aria-hidden="true" />
          <span>
            Untuk pengembangan lokal: jalankan <code>npm run supabase:start</code>, lalu salin
            nilai API URL dan anon key dari output-nya.
          </span>
        </div>
      </div>
    </div>
  );
}
