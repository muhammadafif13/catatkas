import { useEffect, useMemo, useState } from 'react';
import FormField from './FormField';
import Modal from '../ui/Modal';
import TypeToggle from './TypeToggle';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { toast } from '../../stores/useUIStore';
import { COLOR_OPTIONS, EMOJI_OPTIONS } from '../../utils/constants';
import { getErrorMessage } from '../../utils/helpers';
import { validateCategory } from '../../utils/validation';

export default function CategoryFormModal({ open, onClose, category = null, defaultType = 'expense' }) {
  const categories = useCategoryStore((state) => state.categories);
  const addCategory = useCategoryStore((state) => state.addCategory);
  const updateCategory = useCategoryStore((state) => state.updateCategory);
  const [form, setForm] = useState({
    type: defaultType,
    name: '',
    icon: EMOJI_OPTIONS[0],
    color: '#6366f1',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      type: category?.type || defaultType,
      name: category?.name || '',
      icon: category?.icon || EMOJI_OPTIONS[0],
      color: category?.color || '#6366f1',
    });
    setErrors({});
  }, [open, category, defaultType]);

  const existingOfType = useMemo(
    () => categories.filter((item) => item.type === form.type),
    [categories, form.type],
  );

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleTypeChange = (type) => {
    if (category) return;
    setForm((current) => ({ ...current, type }));
    setErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateCategory(form, existingOfType, category?.id || null);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      if (category) {
        await updateCategory(category.id, form);
        toast.success('Kategori berhasil diperbarui.');
      } else {
        await addCategory(form);
        toast.success('Kategori berhasil ditambahkan.');
      }
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? 'Edit kategori' : 'Tambah kategori'}
      description="Gunakan nama singkat dan ikon yang mudah dikenali."
      actions={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Batal
          </button>
          <button type="submit" form="category-form" className="btn btn--primary" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan Kategori'}
          </button>
        </>
      }
    >
      <form id="category-form" className="form-grid" onSubmit={handleSubmit} noValidate>
        {!category ? (
          <FormField label="Jenis kategori" full>
            <TypeToggle value={form.type} onChange={handleTypeChange} />
          </FormField>
        ) : (
          <div className="callout callout--primary form-grid__full">
            <span>
              Kategori ini termasuk {form.type === 'income' ? 'pemasukan' : 'pengeluaran'}.
            </span>
          </div>
        )}

        <FormField label="Nama kategori" htmlFor="category-name" error={errors.name} full>
          <input
            id="category-name"
            className="input"
            type="text"
            maxLength={40}
            placeholder="Contoh: Kopi & Camilan"
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
          />
        </FormField>

        <FormField label="Ikon" error={errors.icon} full>
          <div className="emoji-grid">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`emoji-option${form.icon === emoji ? ' is-selected' : ''}`}
                onClick={() => update('icon', emoji)}
                aria-pressed={form.icon === emoji}
                aria-label={`Pilih ikon ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Warna" error={errors.color} full>
          <div className="color-grid">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                className={`color-option${form.color === color ? ' is-selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => update('color', color)}
                aria-pressed={form.color === color}
                aria-label={`Pilih warna ${color}`}
              />
            ))}
          </div>
        </FormField>
      </form>
    </Modal>
  );
}
