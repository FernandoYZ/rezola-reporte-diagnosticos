/**
 * Gráfico de Clasificación Diagnóstica
 * Gráfico de dona mostrando la distribución por tipo de diagnóstico
 */

const colors = {
  success: '#10b981',
  warning: '#f59e0b',
  secondary: '#64748b'
};

export function renderClasificacionChart(elementId, datos) {
  const labels = datos.map(d => d.ClasificacionDiagnostico);
  const valores = datos.map(d => d.CantidadAtenciones);

  // Calcular porcentajes
  const total = valores.reduce((sum, val) => sum + val, 0);
  const porcentajes = valores.map(val => ((val / total) * 100).toFixed(1));

  const options = {
    series: valores,
    labels: labels,
    chart: {
      type: 'donut',
      height: '100%',
      fontFamily: 'Inter, sans-serif',
      animations: { enabled: true }
    },
    colors: [colors.success, colors.warning, colors.secondary],
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '13px',
              color: '#64748b',
              fontWeight: 600
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 800,
              color: '#1e293b',
              formatter: (val) => val
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total',
              fontSize: '11px',
              fontWeight: 600,
              color: '#64748b',
              formatter: () => total
            }
          }
        }
      }
    },
    legend: {
      show: true,
      position: 'bottom',
      fontSize: '12px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 600,
      markers: { radius: 12 },
      itemMargin: { horizontal: 12, vertical: 6 }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => val + ' atenciones'
      }
    }
  };

  const chart = new ApexCharts(document.querySelector(`#${elementId}`), options);
  chart.render();
  return chart;
}
