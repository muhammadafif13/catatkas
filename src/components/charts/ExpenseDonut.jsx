import { Doughnut } from 'react-chartjs-2';
import { useTheme } from '../../hooks/useTheme';
import { formatCurrency } from '../../utils/formatCurrency';
import { baseTooltip, getChartTheme } from './chartSetup';

export default function ExpenseDonut({ labels, values, colors, total }) {
  useTheme();
  const theme = getChartTheme();

  if (!values?.length || !total) {
    return <div className="chart-empty">Belum ada pengeluaran pada periode ini.</div>;
  }

  return (
    <div className="chart-wrap chart-wrap--pie">
      <Doughnut
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: colors,
              borderColor: theme.tooltipBg,
              borderWidth: 2,
              hoverOffset: 6,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: { display: false },
            tooltip: {
              ...baseTooltip(theme),
              callbacks: {
                label: (context) => ` ${context.label}: ${formatCurrency(context.parsed)}`,
              },
            },
          },
        }}
      />
      <div className="donut-center">
        <span className="donut-center__label">Total</span>
        <span className="donut-center__value">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
