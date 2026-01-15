/**
 * Gráfico de Pirámide Poblacional
 * Barras horizontales stacked mostrando distribución por edad y sexo
 */

const colors = {
  info: '#0ea5e9',
  pink: '#ec4899'
};

export function renderPiramideChart(elementId, datos) {
  // Convertir datos a formato de pirámide (valores negativos para hombres)
  const rangoEdades = datos.map(d => d.RangoEdad);
  const masculino = datos.map(d => -Math.abs(d.Masculino)); // Negativos para la izquierda
  const femenino = datos.map(d => d.Femenino);

  const options = {
    series: [
      { name: 'Hombres', data: masculino },
      { name: 'Mujeres', data: femenino }
    ],
    chart: {
      type: 'bar',
      height: '100%',
      stacked: true,
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false },
      animations: { enabled: true }
    },
    colors: [colors.info, colors.pink],
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '80%',
        borderRadius: 0
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      labels: {
        show: true,
        formatter: (val) => Math.abs(val),
        style: { fontSize: '10px', colors: '#64748b', fontWeight: 500 }
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      categories: rangoEdades
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '11px',
          fontWeight: 600,
          colors: ['#475569']
        }
      }
    },
    tooltip: {
      theme: 'light',
      shared: false,
      x: { show: true },
      y: {
        formatter: (val) => Math.abs(val) + ' pacientes'
      }
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '12px',
      fontWeight: 600,
      markers: { radius: 12 }
    },
    grid: {
      show: true,
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
      padding: { top: 0, right: 10, bottom: 0, left: 10 }
    }
  };

  const chart = new ApexCharts(document.querySelector(`#${elementId}`), options);
  chart.render();
  return chart;
}
