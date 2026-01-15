import { autocomplete } from './components/autocomplete.js';
import { dashboardApp } from './components/dashboard-app.js';
import { reportesApp } from './components/reportes-app.js';

// Importar funciones de gráficos (ApexCharts ya está disponible desde CDN)
import {
  renderTendenciaChart,
  renderFinanciamientoChart,
  renderPiramideChart,
  renderClasificacionChart,
  renderCondicionChart
} from './charts/dashboard.js';

// Exponer funciones globalmente para Alpine.js
window.autocomplete = autocomplete;
window.dashboardApp = dashboardApp;
window.reportesApp = reportesApp;

// Exponer funciones de gráficos globalmente
window.renderTendenciaChart = renderTendenciaChart;
window.renderFinanciamientoChart = renderFinanciamientoChart;
window.renderPiramideChart = renderPiramideChart;
window.renderClasificacionChart = renderClasificacionChart;
window.renderCondicionChart = renderCondicionChart;

console.log("Cliente activado - ApexCharts desde CDN");