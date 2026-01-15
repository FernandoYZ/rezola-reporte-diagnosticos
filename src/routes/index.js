import { Hono } from "hono";
import { renderEta } from "../config/template.js";
import {
  buscarDiagnosticosPorCodigo,
  Pagina,
  PaginaReportes,
  obtenerReporteCompleto,
  obtenerReporteTablas,
  BuscarDiagnosticos,
} from "../controllers/diagnosticos.js";
import { calcularRangoFechas, obtenerMesAnterior } from "../utils/fechas.js";
import { formatearFechaSQL } from "../utils/contantes.js";
import ExcelJS from "exceljs";

const rutas = new Hono();

// Página principal
rutas.get('/', Pagina);

// Página de reportes (solo tablas, sin gráficos)
rutas.get('/reportes', PaginaReportes);

// API: Buscar diagnósticos por código CIE-10 (retorna JSON para Alpine.js)
rutas.get('/api/diagnosticos', BuscarDiagnosticos);

// API: Endpoint principal para HTMX - Retorna todo el contenido del dashboard
rutas.get('/api/datos-dashboard', async (c) => {
  const Codigo = c.req.query('Codigo');
  const mode = c.req.query('mode') || 'mes';
  const año = c.req.query('año');
  const mes = c.req.query('mes');
  const trimestre = c.req.query('trimestre');
  const semestre = c.req.query('semestre');
  const fechaInicio = c.req.query('fechaInicio');
  const fechaFin = c.req.query('fechaFin');

  // Validar que haya diagnóstico
  if (!Codigo) {
    return c.html(`
      <div class="col-span-full text-center py-12">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
          <svg class="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Selecciona un diagnóstico</h3>
        <p class="text-gray-600">Por favor selecciona un diagnóstico del sidebar para generar el reporte</p>
      </div>
    `);
  }

  // Calcular rango de fechas según el modo
  const { fechaInicio: fechaInicioCalculada, fechaFin: fechaFinCalculada, label } = calcularRangoFechas(mode, {
    año,
    mes,
    trimestre,
    semestre,
    fechaInicio,
    fechaFin
  });

  try {
    // Obtener datos completos del servidor
    const datos = await obtenerReporteCompleto(Codigo, fechaInicioCalculada, fechaFinCalculada);

    if (!datos || !datos.kpi) {
      return c.html(`
        <div class="col-span-full text-center py-12">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No hay datos disponibles</h3>
          <p class="text-gray-600">No se encontraron datos para el período y diagnóstico seleccionados</p>
        </div>
      `);
    }

    // Renderizar contenido completo (KPIs + gráficos con datos)
    const html = renderEta('../components/dashboard/content', { datos, label }, 'empty');
    return c.html(html);
  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    return c.html(`
      <div class="col-span-full text-center py-12">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Error al cargar datos</h3>
        <p class="text-gray-600">Ocurrió un error al cargar los datos. Por favor intenta nuevamente.</p>
        <p class="text-xs text-gray-500 mt-2">${error.message}</p>
      </div>
    `);
  }
});

// API: Endpoint para tablas adicionales (Febriles, IRAS, EDAS, Info Personal)
rutas.get('/api/datos-tablas', async (c) => {
  const fechaInicio = c.req.query('fechaInicio');
  const fechaFin = c.req.query('fechaFin');

  // Parámetros de búsqueda para filtrar
  const searchFebriles = c.req.query('searchFebriles');
  const searchIras = c.req.query('searchIras');
  const searchEdas = c.req.query('searchEdas');
  const searchInfoPersonal = c.req.query('searchInfoPersonal');
  
  // Las fechas ya vienen calculadas desde el cliente simplificado
  const fechaInicioCalculada = fechaInicio;
  const fechaFinCalculada = fechaFin;

  try {
    // Obtener datos de las tablas
    let datos = await obtenerReporteTablas(fechaInicioCalculada, fechaFinCalculada);

    // Función helper para filtrar arrays
    const filtrarPacientes = (array, searchTerm) => {
      if (!searchTerm || searchTerm.trim() === '') return array;

      const termino = searchTerm.toLowerCase().trim();
      return array.filter(row => {
        const paciente = (row.paciente || '').toLowerCase();
        const documento = (row.NroDocumento || '').toLowerCase();
        const distrito = (row.distrito || '').toLowerCase();
        const domicilio = (row.domicilio || '').toLowerCase();

        return paciente.includes(termino) ||
               documento.includes(termino) ||
               distrito.includes(termino) ||
               domicilio.includes(termino);
      });
    };

    // Aplicar filtros si existen y retornar solo la tabla específica
    if (searchFebriles !== undefined) {
      datos.tablaFebres = filtrarPacientes(datos.tablaFebres, searchFebriles);
      const html = renderEta('../components/dashboard/_tabla_febriles_body', { datos }, 'empty');
      return c.html(html);
    }

    if (searchIras !== undefined) {
      datos.tablaIras = filtrarPacientes(datos.tablaIras, searchIras);
      const html = renderEta('../components/dashboard/_tabla_iras_body', { datos }, 'empty');
      return c.html(html);
    }

    if (searchEdas !== undefined) {
      datos.tablaEdas = filtrarPacientes(datos.tablaEdas, searchEdas);
      const html = renderEta('../components/dashboard/_tabla_edas_body', { datos }, 'empty');
      return c.html(html);
    }

    if (searchInfoPersonal !== undefined) {
      datos.tablaInformacionPersonal = filtrarPacientes(datos.tablaInformacionPersonal, searchInfoPersonal);
      const html = renderEta('../components/dashboard/_tabla_info_body', { datos }, 'empty');
      return c.html(html);
    }

    // Si no hay filtros, renderizar todas las tablas
    const html = renderEta('../components/dashboard/tablas_adicionales', { datos }, 'empty');
    return c.html(html);
  } catch (error) {
    console.error('Error al obtener datos de tablas:', error);
    return c.html(`
      <div class="col-span-full text-center py-12">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Error al cargar tablas</h3>
        <p class="text-gray-600">Ocurrió un error al cargar las tablas adicionales.</p>
        <p class="text-xs text-gray-500 mt-2">${error.message}</p>
      </div>
    `);
  }
});

// API: Endpoint para exportar tablas a Excel
rutas.get('/api/exportar-tablas', async (c) => {
  const fechaInicio = c.req.query('fechaInicio');
  const fechaFin = c.req.query('fechaFin');

  // Las fechas ya vienen calculadas desde el cliente simplificado
  const fechaInicioCalculada = fechaInicio;
  const fechaFinCalculada = fechaFin;

  try {
    // Obtener datos de las tablas
    const datos = await obtenerReporteTablas(fechaInicioCalculada, fechaFinCalculada);

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SIHCE - Hospital Regional Rezola Cañete';
    workbook.created = new Date();

    // Estilos comunes
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } },
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
    };

    const cellStyle = {
      alignment: { vertical: 'middle', horizontal: 'left' },
      border: {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      }
    };

    // HOJA 1: FEBRILES
    if (datos.tablaFebres.length > 0) {
      const sheetFebriles = workbook.addWorksheet('Cuadros Febriles');

      // Configurar columnas
      sheetFebriles.columns = [
        { header: 'CIE-10', key: 'CodigoCIE10', width: 12 },
        { header: 'Diagnóstico', key: 'Descripcion', width: 40 },
        { header: 'N° Atención', key: 'IdAtencion', width: 12 },
        { header: 'Fecha Ingreso', key: 'FechaIngreso', width: 15 },
        { header: 'Paciente', key: 'paciente', width: 35 },
        { header: 'Edad', key: 'Edad', width: 8 },
        { header: 'Documento', key: 'NroDocumento', width: 12 },
        { header: 'Domicilio', key: 'domicilio', width: 35 },
        { header: 'Distrito', key: 'distrito', width: 20 },
        { header: 'Celular', key: 'Celular', width: 12 }
      ];

      // Aplicar estilo al header
      sheetFebriles.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      // Agregar datos
      datos.tablaFebres.forEach((row) => {
        const newRow = sheetFebriles.addRow({
          CodigoCIE10: row.CodigoCIE10,
          Descripcion: row.Descripcion,
          IdAtencion: row.IdAtencion,
          FechaIngreso: row.FechaFormateada || '-',
          paciente: row.paciente,
          Edad: row.Edad,
          NroDocumento: row.NroDocumento || '-',
          domicilio: row.domicilio || '-',
          distrito: row.distrito || '-',
          Celular: row.Celular || '-'
        });
        newRow.eachCell((cell) => {
          cell.style = cellStyle;
        });
      });

      sheetFebriles.getRow(1).height = 25;
    }

    // HOJA 2: IRAS
    if (datos.tablaIras.length > 0) {
      const sheetIras = workbook.addWorksheet('IRAS');

      sheetIras.columns = [
        { header: 'Diagnóstico', key: 'Descripcion', width: 40 },
        { header: 'N° Atención', key: 'IdAtencion', width: 12 },
        { header: 'Paciente', key: 'paciente', width: 35 },
        { header: 'Edad', key: 'Edad', width: 8 },
        { header: 'Documento', key: 'NroDocumento', width: 12 },
        { header: 'Domicilio', key: 'domicilio', width: 35 },
        { header: 'Distrito', key: 'distrito', width: 20 },
        { header: 'Celular', key: 'Celular', width: 12 }
      ];

      sheetIras.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      datos.tablaIras.forEach((row) => {
        const newRow = sheetIras.addRow({
          Descripcion: row.Descripcion,
          IdAtencion: row.IdAtencion,
          paciente: row.paciente,
          Edad: row.Edad,
          NroDocumento: row.NroDocumento || '-',
          domicilio: row.domicilio || '-',
          distrito: row.distrito || '-',
          Celular: row.Celular || '-'
        });
        newRow.eachCell((cell) => {
          cell.style = cellStyle;
        });
      });

      sheetIras.getRow(1).height = 25;
    }

    // HOJA 3: EDAS
    if (datos.tablaEdas.length > 0) {
      const sheetEdas = workbook.addWorksheet('EDAS');

      sheetEdas.columns = [
        { header: 'CIE-10', key: 'CodigoCIE10', width: 12 },
        { header: 'Diagnóstico', key: 'Descripcion', width: 40 },
        { header: 'N° Atención', key: 'IdAtencion', width: 12 },
        { header: 'Paciente', key: 'paciente', width: 35 },
        { header: 'Edad', key: 'Edad', width: 8 },
        { header: 'Documento', key: 'NroDocumento', width: 12 },
        { header: 'Domicilio', key: 'domicilio', width: 35 },
        { header: 'Distrito', key: 'distrito', width: 20 },
        { header: 'Celular', key: 'Celular', width: 12 }
      ];

      sheetEdas.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      datos.tablaEdas.forEach((row) => {
        const newRow = sheetEdas.addRow({
          CodigoCIE10: row.CodigoCIE10,
          Descripcion: row.Descripcion,
          IdAtencion: row.IdAtencion,
          paciente: row.paciente,
          Edad: row.Edad,
          NroDocumento: row.NroDocumento || '-',
          domicilio: row.domicilio || '-',
          distrito: row.distrito || '-',
          Celular: row.Celular || '-'
        });
        newRow.eachCell((cell) => {
          cell.style = cellStyle;
        });
      });

      sheetEdas.getRow(1).height = 25;
    }

    // HOJA 4: INFORMACIÓN PERSONAL
    if (datos.tablaInformacionPersonal.length > 0) {
      const sheetInfo = workbook.addWorksheet('Información Personal');

      sheetInfo.columns = [
        { header: 'CIE-10', key: 'CodigoCIE10', width: 12 },
        { header: 'Diagnóstico', key: 'Descripcion', width: 40 },
        { header: 'N° Atención', key: 'IdAtencion', width: 12 },
        { header: 'Fecha Ingreso', key: 'FechaIngreso', width: 15 },
        { header: 'Paciente', key: 'paciente', width: 35 },
        { header: 'Edad', key: 'Edad', width: 8 },
        { header: 'Documento', key: 'NroDocumento', width: 12 },
        { header: 'Domicilio', key: 'domicilio', width: 35 },
        { header: 'Distrito', key: 'distrito', width: 20 },
        { header: 'Celular', key: 'Celular', width: 12 }
      ];

      sheetInfo.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      datos.tablaInformacionPersonal.forEach((row) => {
        const newRow = sheetInfo.addRow({
          CodigoCIE10: row.CodigoCIE10,
          Descripcion: row.Descripcion,
          IdAtencion: row.IdAtencion,
          FechaIngreso: row.FechaFormateada || '-',
          paciente: row.paciente,
          Edad: row.Edad,
          NroDocumento: row.NroDocumento || '-',
          domicilio: row.domicilio || '-',
          distrito: row.distrito || '-',
          Celular: row.Celular || '-'
        });
        newRow.eachCell((cell) => {
          cell.style = cellStyle;
        });
      });

      sheetInfo.getRow(1).height = 25;
    }

    // Generar buffer del archivo Excel
    const buffer = await workbook.xlsx.writeBuffer();

    // Nombre del archivo con fecha
    const nombreArchivo = `Reporte_Tablas_${fechaInicioCalculada}_${fechaFinCalculada}.xlsx`;

    // Configurar headers para descarga
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', `attachment; filename="${nombreArchivo}"`);

    return c.body(buffer);
  } catch (error) {
    console.error('Error al exportar Excel:', error);
    return c.json({ error: 'Error al generar el archivo Excel', message: error.message }, 500);
  }
});

export default rutas;
