import { Hono } from "hono";
import {
  Pagina,
  PaginaReportes,
  BuscarDiagnosticos,
  getDashboardData,
  getTablesData,
  exportTablesData
} from "../controllers/diagnosticos.js";

const rutas = new Hono();

// Página principal
rutas.get('/', Pagina);

// Página de reportes (solo tablas, sin gráficos)
rutas.get('/reportes', PaginaReportes);

// API: Buscar diagnósticos por código CIE-10 (retorna JSON para Alpine.js)
rutas.get('/api/diagnosticos', BuscarDiagnosticos);

// API: Endpoint principal para HTMX - Retorna todo el contenido del dashboard
rutas.get('/api/datos-dashboard', getDashboardData);

// API: Endpoint para tablas adicionales (Febriles, IRAS, EDAS, Info Personal)
rutas.get('/api/datos-tablas', getTablesData);

// API: Endpoint para exportar tablas a Excel
rutas.get('/api/exportar', exportTablesData);

export default rutas;
