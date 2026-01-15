/**
 * Utilidades para cálculo de fechas y períodos en el servidor
 */

/**
 * Calcula el rango de fechas según el modo y parámetros seleccionados
 * @param {string} mode - Modo de período: 'mes', 'trimestre', 'semestre', 'año', 'custom'
 * @param {Object} params - Parámetros del período
 * @returns {Object} { fechaInicio, fechaFin, label }
 */
export function calcularRangoFechas(mode, params) {
  const { año, mes, trimestre, semestre, fechaInicio, fechaFin } = params;

  let inicio, fin, label;

  switch (mode) {
    case 'mes': {
      const mesNum = parseInt(mes);
      const añoNum = parseInt(año);
      const ultimoDia = new Date(añoNum, mesNum + 1, 0).getDate();

      inicio = `${añoNum}-${String(mesNum + 1).padStart(2, '0')}-01`;
      fin = `${añoNum}-${String(mesNum + 1).padStart(2, '0')}-${ultimoDia}`;

      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      label = `${meses[mesNum]} ${añoNum}`;
      break;
    }

    case 'trimestre': {
      const trim = parseInt(trimestre);
      const añoNum = parseInt(año);
      const mesInicio = trim * 3;
      const mesFin = mesInicio + 2;
      const ultimoDia = new Date(añoNum, mesFin + 1, 0).getDate();

      inicio = `${añoNum}-${String(mesInicio + 1).padStart(2, '0')}-01`;
      fin = `${añoNum}-${String(mesFin + 1).padStart(2, '0')}-${ultimoDia}`;
      label = `Trimestre ${['I', 'II', 'III', 'IV'][trim]} - ${añoNum}`;
      break;
    }

    case 'semestre': {
      const sem = parseInt(semestre);
      const añoNum = parseInt(año);
      const mesInicio = sem * 6;
      const mesFin = mesInicio + 5;
      const ultimoDia = new Date(añoNum, mesFin + 1, 0).getDate();

      inicio = `${añoNum}-${String(mesInicio + 1).padStart(2, '0')}-01`;
      fin = `${añoNum}-${String(mesFin + 1).padStart(2, '0')}-${ultimoDia}`;
      label = `Semestre ${['I', 'II'][sem]} - ${añoNum}`;
      break;
    }

    case 'año': {
      const añoNum = parseInt(año);
      inicio = `${añoNum}-01-01`;
      fin = `${añoNum}-12-31`;
      label = `Año ${añoNum}`;
      break;
    }

    case 'custom': {
      inicio = fechaInicio;
      fin = fechaFin;
      label = `${fechaInicio} - ${fechaFin}`;
      break;
    }

    default:
      throw new Error(`Modo de período desconocido: ${mode}`);
  }

  return { fechaInicio: inicio, fechaFin: fin, label };
}

/**
 * Obtiene el mes anterior al actual
 * @returns {Object} { año, mes, fechaInicio, fechaFin }
 */
export function obtenerMesAnterior() {
  const ahora = new Date();
  const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  const año = mesAnterior.getFullYear();
  const mes = mesAnterior.getMonth(); // 0-11

  const primerDia = new Date(año, mes, 1);
  const ultimoDia = new Date(año, mes + 1, 0);

  const fechaInicio = primerDia.toISOString().split('T')[0];
  const fechaFin = ultimoDia.toISOString().split('T')[0];

  return {
    año: año.toString(),
    mes: mes.toString(),
    fechaInicio,
    fechaFin
  };
}

/**
 * Obtiene los últimos 7 días (semana actual)
 * Fecha Fin = hoy, Fecha Inicio = hoy - 7 días
 * @returns {Object} { fechaInicio, fechaFin }
 */
export function obtenerUltimaSemana() {
  const hoy = new Date();
  const hace7Dias = new Date();
  hace7Dias.setDate(hoy.getDate() - 7);

  const fechaInicio = hace7Dias.toISOString().split('T')[0];
  const fechaFin = hoy.toISOString().split('T')[0];

  return {
    fechaInicio,
    fechaFin
  };
}
