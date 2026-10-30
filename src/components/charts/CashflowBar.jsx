import { Bar } from 'react-chartjs-2';
import { useTheme } from '../../hooks/useTheme';
import { formatCompactCurrency, formatCurrency } from '../../utils/formatCurrency';
import { baseTooltip, getChartTheme } from './chartSetup';

export default function CashflowBar({ labels, income, expense }) {
  useTheme();
  const theme = getChartTheme();
  const hasData =
    income?.some((value) => Number(value) > 0) || expense?.some((value) => Number(value) > 0);

  if (!hasData) {
    return <div className="chart-empty">Belum ada arus kas dalam 7 hari terakhir.</div>;
  }

  return (
    <div className="chart-wrap chart-wrap--bar">
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: 'Pemasukan',
              data: income,
              backgroundColor: 'rgba(34, 197, 94, 0.78)',
              borderRadius: 5,
              maxBarThickness: 18,
            },
            {
              label: 'Pengeluaran',
              data: expense,
              backgroundColor: 'rgba(239, 68, 68, 0.78)',
              borderRadius: 5,
              maxBarThickness: 18,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: theme.text,
                boxWidth: 8,
                boxHeight: 8,
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 16,
                font: { size: 11 },
              },
            },
            tooltip: {
              ...baseTooltip(theme),
              callbacks: {
                label: (context) =>
                  ` ${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: theme.text, font: { size: 10 } },
              border: { display: false },
            },
            y: {
              beginAtZero: true,
              grid: { color: theme.grid },
              ticks: {
                color: theme.text,
                font: { size: 10 },
                callback: (value) => formatCompactCurrency(value),
              },
              border: { display: false },
            },
          },
        }}
      />
    </div>
  );
}
