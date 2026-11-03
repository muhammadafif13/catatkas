import BrandMark from './BrandMark';

export default function SplashScreen({ title = 'CatatKas', message = 'Menyiapkan catatan keuanganmu…' }) {
  return (
    <div className="splash-screen" role="status" aria-live="polite">
      <div className="splash-screen__mark">
        <span className="splash-screen__glow" aria-hidden="true" />
        <span className="splash-screen__ring" aria-hidden="true" />
        <BrandMark size={88} className="splash-screen__logo" decorative src="favicon.svg" />
      </div>
      <div>
        <div className="splash-screen__title">{title}</div>
        <p className="splash-screen__text">Catat keuanganmu, kendalikan hidupmu.</p>
      </div>
      <div className="splash-screen__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="splash-screen__message">{message}</p>
    </div>
  );
}
