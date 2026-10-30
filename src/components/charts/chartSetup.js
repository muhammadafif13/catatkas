import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';

Chart.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
);

export function getChartTheme() {
  const styles = getComputedStyle(document.documentElement);
  return {
    text: styles.getPropertyValue('--chart-text').trim() || '#94a3b8',
    grid: styles.getPropertyValue('--chart-grid').trim() || 'rgba(148, 163, 184, 0.14)',
    tooltipBg: styles.getPropertyValue('--chart-tooltip-bg').trim() || '#1e293b',
    tooltipBorder: styles.getPropertyValue('--chart-tooltip-border').trim() || '#334155',
    income: '#22c55e',
    expense: '#ef4444',
    primary: '#6366f1',
  };
}

export function baseTooltip(theme) {
  return {
    backgroundColor: theme.tooltipBg,
    titleColor: theme.text,
    bodyColor: theme.text,
    borderColor: theme.tooltipBorder,
    borderWidth: 1,
    padding: 10,
    cornerRadius: 8,
    displayColors: true,
    boxPadding: 4,
  };
}
