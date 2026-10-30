import { Line } from 'react-chartjs-2';
import { useTheme } from '../../hooks/useTheme';
import { formatCompactCurrency, formatCurrency } from '../../utils/formatCurrency';
import { baseTooltip, getChartTheme } from './chartSetup';

export default function BalanceLine({ labels, values }) {
  useTheme();
  const theme = getChartTheme();
  const hasData = values?.some((value) => Number(value) !== 0);

  if (!hasData) {
    return <div className="chart-empty">Belum ada pergerakan saldo untuk ditampilkan.</div>;
  }

  return (
    <div className="chart-wrap chart-wrap--line">
      <Line
        data={{
          labels,
          datasets: [
            {
              label: 'Saldo',
              data: values,
              borderColor: theme.primary,
              backgroundColor: 'rgba(99, 102, 241, 0.18)',
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointHoverBackgroundColor: theme.primary,
              pointHoverBorderColor: '#ffffff',
              pointHoverBorderWidth: 2,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              ...baseTooltip(theme),
              callbacks: {
                label: (context) => ` Saldo: ${formatCurrency(context.parsed.y)}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: theme.text, font: { size: 10 }, maxTicksLimit: 7 },
              border: { display: false },
            },
            y: {
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
