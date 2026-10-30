import BrandMark from './BrandMark';
import LoadingSpinner from './LoadingSpinner';

export default function SplashScreen({ title = 'CatatKas', message = 'Menyiapkan catatan keuanganmu…' }) {
  return (
    <div className="splash-screen">
      <BrandMark size={88} className="splash-screen__logo" decorative />
      <div>
        <div className="splash-screen__title">{title}</div>
        <p className="splash-screen__text">Catat keuanganmu, kendalikan hidupmu.</p>
      </div>
      <div className="splash-screen__spinner">
        <LoadingSpinner label={message} />
      </div>
    </div>
  );
}
