import { classNames } from '../../utils/helpers';

export default function BrandMark({ size = 38, className = '', decorative = false }) {
  return (
    <img
      className={classNames('brand-mark', className)}
      src={`${import.meta.env.BASE_URL}logo.svg`}
      width={size}
      height={size}
      alt={decorative ? '' : 'CatatKas'}
      aria-hidden={decorative || undefined}
    />
  );
}
