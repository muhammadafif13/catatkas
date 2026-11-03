import { classNames } from '../../utils/helpers';

export default function BrandMark({ size = 38, className = '', decorative = false, src = 'logo.svg' }) {
  return (
    <img
      className={classNames('brand-mark', className)}
      src={`${import.meta.env.BASE_URL}${src}`}
      width={size}
      height={size}
      alt={decorative ? '' : 'CatatKas'}
      aria-hidden={decorative || undefined}
    />
  );
}
