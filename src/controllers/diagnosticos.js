import { obtenerPool } from "../config/database.js";
import {
  BUSCAR_CODIGO_DIAGNOSTICO,
  OBTENER_KPI_RANGO_FECHA_CODIGO,
  TABLA_DIAGNOSTICOS,
  GRAFICO_TIPO_FINANCIAMIENTO,
  GRAFICO_PIRAMIDE_PACIENTES,
  GRAFICO_CLASIFICACION_DIAGNOSTICO,
  GRAFICO_CONDICION_PACIENTE,
  TABLA_RANKING_INCIDENCIAS_PROVINCIAS,
  CANTIDADES_ATENCIONES_POR_DIA,
  CANTIDADES_ATENCIONES_POR_SEMANA,
  CANTIDADES_ATENCIONES_POR_MES,
  CANTIDADES_ATENCIONES_POR_ANIO,
  TABLA_EDAS,
  TABLA_IRAS,
  TABLA_INFORMACION_PERSONAL,
  TABLA_FEBRILES,
} from "../queries/diagnosticos.js";
import mssql from "mssql";
import { formatearFecha, formatearFechaSQL } from "../utils/contantes.js";
import { ejecutarFecha, ejecutarQuery } from "../utils/queries_diagnositco.js";
import { obtenerMesAnterior, obtenerUltimaSemana } from "../utils/fechas.js";
import { renderEta } from "../config/template.js";

export const Pagina = async (c) => {
  const periodoInicial = obtenerMesAnterior()
  const pagina = renderEta('index', {
    titulo: 'SIHCE - Reporte Diagnósticos',
    pageTitle: 'Reporte Epidemiológico de Diagnósticos',
    periodoInicial
  })

  return c.html(pagina)
}

export const PaginaReportes = async (c) => {
  const periodoInicial = obtenerUltimaSemana()
  const pagina = renderEta('reportes', {
    titulo: 'SIHCE - Reportes Epidemiológicos',
    pageTitle: 'Reportes Detallados por Paciente',
    periodoInicial
  })

  return c.html(pagina)
}

export const BuscarDiagnosticos = async (c) => {
  const buscar = c.req.query("buscar") || "";
  const pagina = parseInt(c.req.query("pagina")) || 1;
  const cantidad = parseInt(c.req.query("cantidad")) || 15;

  const diagnosticos = await buscarDiagnosticosPorCodigo(buscar, pagina, cantidad);

  return c.json(diagnosticos)
}

// Buscar diagnósticos por código CIE-10
export async function buscarDiagnosticosPorCodigo(buscar, pagina = 1, cantidad = 15) {
  const pool = obtenerPool();
  const result = await pool
    .request()
    .input("buscar", mssql.VarChar(10), buscar || "")
    .input("pagina", mssql.Int, pagina)
    .input("cantidad", mssql.Int, cantidad)
    .query(BUSCAR_CODIGO_DIAGNOSTICO);

  return result.recordset;
}

// Determinar qué query usar para tendencia según el rango de fechas
function obtenerQueryTendencia(FechaInicio, FechaFin) {
  const inicio = new Date(FechaInicio);
  const fin = new Date(FechaFin);
  const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));

  // Determinar tipo de agrupación
  let query, tipo, compararPeriodoAnterior;

  if (dias <= 31) {
    query = CANTIDADES_ATENCIONES_POR_DIA;
    tipo = "dia";
    compararPeriodoAnterior = true; // Factible comparar (max ~60 registros)
  } else if (dias <= 120) {
    query = CANTIDADES_ATENCIONES_POR_SEMANA;
    tipo = "semana";
    compararPeriodoAnterior = true; // Factible comparar (max ~34 registros)
  } else if (dias <= 730) {
    query = CANTIDADES_ATENCIONES_POR_MES;
    tipo = "mes";
    compararPeriodoAnterior = dias <= 365; // Solo si es 1 año o menos (max ~24 registros)
  } else {
    query = CANTIDADES_ATENCIONES_POR_ANIO;
    tipo = "anio";
    compararPeriodoAnterior = false; // No factible, demasiados datos
  }

  // Calcular período anterior si aplica
  let periodoAnterior = null;
  if (compararPeriodoAnterior) {
    const fechaInicioAnterior = new Date(inicio);
    fechaInicioAnterior.setDate(fechaInicioAnterior.getDate() - dias);

    const fechaFinAnterior = new Date(inicio);
    fechaFinAnterior.setDate(fechaFinAnterior.getDate() - 1);

    periodoAnterior = {
      fechaInicio: fechaInicioAnterior.toISOString().split("T")[0],
      fechaFin: fechaFinAnterior.toISOString().split("T")[0],
    };
  }

  return {
    query,
    tipo,
    compararPeriodoAnterior,
    periodoAnterior,
    diasRango: dias,
  };
}

// Formatear datos de tendencia con fechas legibles
function formatearDatosTendencia(datos, tipoAgrupacion) {
  return datos.map((item) => {
    // Detectar qué campo de fecha tiene el item
    const campoFecha =
      item.Fecha || item.InicioSemana || item.InicioMes || item.InicioAnio;

    return {
      ...item,
      FechaFormateada: formatearFecha(campoFecha, tipoAgrupacion),
    };
  });
}

export async function obtenerReporteCompleto(Codigo, FechaInicio, FechaFin) {
  const {
    query: queryTendencia,
    tipo: tipoAgrupacion,
    compararPeriodoAnterior,
    periodoAnterior,
    diasRango,
  } = obtenerQueryTendencia(FechaInicio, FechaFin);

  // Queries base (siempre se ejecutan)
  const promesasBase = [
    ejecutarQuery(
      Codigo,
      FechaInicio,
      FechaFin,
      OBTENER_KPI_RANGO_FECHA_CODIGO,
    ),
    ejecutarQuery(Codigo, FechaInicio, FechaFin, TABLA_DIAGNOSTICOS),
    ejecutarQuery(Codigo, FechaInicio, FechaFin, queryTendencia),
    ejecutarQuery(Codigo, FechaInicio, FechaFin, GRAFICO_TIPO_FINANCIAMIENTO),
    ejecutarQuery(Codigo, FechaInicio, FechaFin, GRAFICO_PIRAMIDE_PACIENTES),
    ejecutarQuery(
      Codigo,
      FechaInicio,
      FechaFin,
      GRAFICO_CLASIFICACION_DIAGNOSTICO,
    ),
    ejecutarQuery(Codigo, FechaInicio, FechaFin, GRAFICO_CONDICION_PACIENTE),
    ejecutarQuery(
      Codigo,
      FechaInicio,
      FechaFin,
      TABLA_RANKING_INCIDENCIAS_PROVINCIAS,
    ),
  ];

  // Agregar query de período anterior si aplica
  if (compararPeriodoAnterior && periodoAnterior) {
    promesasBase.push(
      ejecutarQuery(
        Codigo,
        periodoAnterior.fechaInicio,
        periodoAnterior.fechaFin,
        queryTendencia,
      ),
    );
  }

  const resultados = await Promise.all(promesasBase);

  // Destructurar resultados
  const [
    kpi,
    tablaDiagnosticos,
    graficoTendenciaAtenciones,
    graficoTipoFinanciamiento,
    graficoPiramidePacientes,
    graficoClasificacionDiagnostico,
    graficoCondicionPaciente,
    tablaIncidenciasProvincias,
    graficoTendenciaAnterior,
  ] = resultados;

  // Formatear datos de tendencia con fechas legibles
  const tendenciaFormateada = formatearDatosTendencia(
    graficoTendenciaAtenciones,
    tipoAgrupacion,
  );
  const tendenciaAnteriorFormateada = graficoTendenciaAnterior
    ? formatearDatosTendencia(graficoTendenciaAnterior, tipoAgrupacion)
    : null;

  return {
    kpi: kpi[0] || null,
    tablaDiagnosticos,
    graficoTendenciaAtenciones: tendenciaFormateada,
    graficoTendenciaAnterior: tendenciaAnteriorFormateada,
    compararPeriodoAnterior,
    diasRango,
    graficoTipoFinanciamiento,
    graficoPiramidePacientes,
    graficoClasificacionDiagnostico,
    graficoCondicionPaciente,
    tablaIncidenciasProvincias,
  };
}

export async function obtenerReporteTablas(FechaInicio, FechaFin) {
  const promesasTablas = [
    ejecutarFecha(FechaInicio, FechaFin, TABLA_FEBRILES),
    ejecutarFecha(FechaInicio, FechaFin, TABLA_IRAS),
    ejecutarFecha(FechaInicio, FechaFin, TABLA_EDAS),
    ejecutarFecha(FechaInicio, FechaFin, TABLA_INFORMACION_PERSONAL),
  ];

  const [
    tablaFebres,
    tablaIras,
    tablaEdas,
    tablaInformacionPersonal,
  ] = await Promise.all(promesasTablas);

  // Formatear fechas para Febriles e Información Personal
  const tablaFebresFormateadas = tablaFebres.map(row => ({
    ...row,
    FechaFormateada: formatearFechaSQL(row.FechaIngreso)
  }));

  const tablaInfoFormateada = tablaInformacionPersonal.map(row => ({
    ...row,
    FechaFormateada: formatearFechaSQL(row.FechaIngreso)
  }));

  return {
    tablaFebres: tablaFebresFormateadas,
    tablaIras,
    tablaEdas,
    tablaInformacionPersonal: tablaInfoFormateada,
  };
}
