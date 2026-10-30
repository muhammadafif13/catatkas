import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="not-found">
      <div className="not-found__code" aria-hidden="true">
        404
      </div>
      <div>
        <h1 className="not-found__title">Halaman tidak ditemukan</h1>
        <p className="not-found__text">
          Tautan yang kamu buka mungkin sudah berubah atau tidak tersedia. Kembali ke beranda untuk
          melanjutkan.
        </p>
      </div>
      <div className="inline-actions">
        <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>
          <ArrowLeft aria-hidden="true" />
          Kembali
        </button>
        <Link to="/" className="btn btn--primary">
          <Home aria-hidden="true" />
          Ke Beranda
        </Link>
      </div>
    </div>
  );
}
