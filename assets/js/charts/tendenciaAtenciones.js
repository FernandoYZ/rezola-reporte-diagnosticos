/**
 * Gráfico de Tendencia Evolutiva
 * Muestra la evolución de atenciones en el tiempo
 * Puede ser por día, semana, mes o año según el rango seleccionado
 */

const commonChartOptions = {
  chart: {
    fontFamily: 'Inter, sans-serif',
    toolbar: { show: false },
    animations: { enabled: true, speed: 800 }
  },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 3 },
  tooltip: {
    theme: 'light',
    style: { fontSize: '12px', fontFamily: 'Inter, sans-serif' },
    x: { show: true }
  }
};

export function renderTendenciaChart(elementId, datosActual, datosAnterior = null) {
  // El servidor ya formatea las fechas según el tipo de agrupación
  const labels = datosActual.map(d => d.FechaFormateada);
  const valoresActual = datosActual.map(d => d.CantidadAtenciones);

  // Preparar series según si hay comparación o no
  const series = [{
    name: 'Período Actual',
    type: 'area',
    data: valoresActual
  }];

  // Agregar serie anterior si existe
  if (datosAnterior && datosAnterior.length > 0) {
    const valoresAnterior = datosAnterior.map(d => d.CantidadAtenciones);
    series.push({
      name: 'Período Anterior',
      type: 'line',
      data: valoresAnterior
    });
  }

  const options = {
    ...commonChartOptions,
    series: series,
    chart: {
      ...commonChartOptions.chart,
      type: 'line',
      height: '100%'
    },
    colors: series.length > 1 ? ['#4f39f6', '#94a3b8'] : ['#4f39f6'],
    fill: {
      type: ['solid', 'solid'],
      colors: series.length > 1 ? ['#eef2ff', 'transparent'] : ['#eef2ff']
    },
    stroke: {
      curve: 'smooth',
      width: series.length > 1 ? [2, 2] : 2,
      dashArray: series.length > 1 ? [0, 5] : 0 // Línea punteada para período anterior
    },
    markers: {
      size: series.length > 1 ? [4, 0] : 4,
      strokeWidth: 2,
      hover: { size: 6 }
    },
    xaxis: {
      categories: labels,
      labels: {
        style: { fontSize: '10px', colors: '#64748b' },
        rotate: -45,
        rotateAlways: false
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      show: true,
      labels: {
        style: { fontSize: '10px', colors: '#64748b' }
      }
    },
    grid: {
      show: true,
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
      padding: { top: 0, right: 10, bottom: 0, left: 10 }
    },
    legend: {
      show: series.length > 1,
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '11px',
      fontWeight: 500,
      markers: {
        width: 10,
        height: 10,
        radius: 2
      },
      itemMargin: {
        horizontal: 10
      }
    }
  };

  const chart = new ApexCharts(document.querySelector(`#${elementId}`), options);
  chart.render();
  return chart;
}
