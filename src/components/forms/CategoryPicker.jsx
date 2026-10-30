import { hexToRgba } from '../../utils/helpers';
import EmptyState from '../ui/EmptyState';

export default function CategoryPicker({ categories, value, onChange, emptyText }) {
  if (!categories.length) {
    return (
      <EmptyState
        compact
        title="Belum ada kategori"
        text={emptyText || 'Tambahkan kategori terlebih dahulu di halaman Kategori.'}
      />
    );
  }

  return (
    <div className="category-picker" role="group" aria-label="Pilih kategori">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          className={`category-option${Number(value) === Number(category.id) ? ' is-selected' : ''}`}
          style={{
            '--category-color': category.color,
            '--category-bg': hexToRgba(category.color, 0.14),
            '--category-ring': hexToRgba(category.color, 0.24),
          }}
          onClick={() => onChange(category.id)}
          aria-pressed={Number(value) === Number(category.id)}
        >
          <span className="category-option__icon" aria-hidden="true">
            {category.icon}
          </span>
          <span className="category-option__name">{category.name}</span>
        </button>
      ))}
    </div>
  );
}
