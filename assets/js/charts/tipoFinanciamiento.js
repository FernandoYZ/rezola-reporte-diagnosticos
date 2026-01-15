/**
 * Gráfico de Tipo de Financiamiento
 * Barras verticales mostrando la distribución por fuente de financiamiento
 */

const colors = {
  primary: '#2563eb',
  info: '#0ea5e9',
  success: '#10b981',
  warning: '#f59e0b',
  secondary: '#64748b',
  violet: '#8b5cf6',
  pink: '#ec4899'
};

export function renderFinanciamientoChart(elementId, datos) {
  const labels = datos.map(d => d.FuenteFinanciamiento);
  const valores = datos.map(d => d.CantidadAtenciones);

  const options = {
    series: [{
      name: 'Atenciones',
      data: valores
    }],
    chart: {
      type: 'bar',
      height: '100%',
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false },
      animations: { enabled: true }
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '55%',
        distributed: true,
        dataLabels: {
          position: 'top'
        }
      }
    },
    colors: [colors.primary, colors.info, colors.success, colors.warning, colors.secondary, colors.violet],
    dataLabels: {
      enabled: true,
      formatter: (val) => val,
      offsetY: -20,
      style: {
        fontSize: '11px',
        fontWeight: 700,
        colors: ['#475569']
      }
    },
    xaxis: {
      categories: labels,
      labels: {
        style: {
          fontSize: '10px',
          fontWeight: 600,
          colors: ['#475569']
        },
        rotate: -45,
        rotateAlways: labels.length > 5
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '10px',
          colors: '#64748b'
        }
      }
    },
    legend: { show: false },
    grid: {
      show: true,
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
      padding: { top: 0, right: 10, bottom: 0, left: 10 }
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
