import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export default function TypeToggle({ value, onChange }) {
  return (
    <div className="segmented" role="group" aria-label="Jenis transaksi">
      <button
        type="button"
        className={`segmented__button segmented__button--income${value === 'income' ? ' is-active' : ''}`}
        onClick={() => onChange('income')}
        aria-pressed={value === 'income'}
      >
        <ArrowDownLeft aria-hidden="true" />
        Pemasukan
      </button>
      <button
        type="button"
        className={`segmented__button segmented__button--expense${value === 'expense' ? ' is-active' : ''}`}
        onClick={() => onChange('expense')}
        aria-pressed={value === 'expense'}
      >
        <ArrowUpRight aria-hidden="true" />
        Pengeluaran
      </button>
    </div>
  );
}
