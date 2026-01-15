/**
 * Gráfico de Condición del Paciente
 * Barras verticales mostrando el estado de admisión (HIS)
 */

const colors = {
  primary: '#2563eb',
  warning: '#f59e0b',
  success: '#10b981'
};

export function renderCondicionChart(elementId, datos) {
  const labels = datos.map(d => d.CondicionPaciente);
  const valores = datos.map(d => d.CantidadAtenciones);

  // Calcular porcentajes
  const total = valores.reduce((sum, val) => sum + val, 0);
  const porcentajes = valores.map(val => ((val / total) * 100).toFixed(1));

  const options = {
    series: [{
      name: 'Pacientes',
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
        columnWidth: '60%',
        distributed: true,
        dataLabels: {
          position: 'top'
        }
      }
    },
    colors: [colors.primary, colors.warning, colors.success],
    dataLabels: {
      enabled: true,
      formatter: (val, opts) => {
        const porcentaje = porcentajes[opts.dataPointIndex];
        return porcentaje + '%';
      },
      offsetY: -20,
      style: {
        fontSize: '12px',
        fontWeight: 700,
        colors: ['#475569']
      }
    },
    xaxis: {
      categories: labels,
      labels: {
        style: {
          fontSize: '11px',
          fontWeight: 600,
          colors: ['#475569']
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        formatter: (val) => val,
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
        formatter: (val, opts) => {
          const porcentaje = porcentajes[opts.dataPointIndex];
          return val + ' atenciones (' + porcentaje + '%)';
        }
      }
    }
  };

  const chart = new ApexCharts(document.querySelector(`#${elementId}`), options);
  chart.render();
  return chart;
}
