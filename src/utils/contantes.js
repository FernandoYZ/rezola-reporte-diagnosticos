// Meses abreviados en español
export const MESES_ABREVIADOS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

// Formatear fecha según el tipo de agrupación
export function formatearFecha(fecha, tipoAgrupacion) {
  const date = new Date(fecha);
  const dia = date.getDate();
  const mes = MESES_ABREVIADOS[date.getMonth()];
  const anio = date.getFullYear();

  switch (tipoAgrupacion) {
    case "dia":
    case "semana":
      return `${dia} ${mes}`;
    case "mes":
      return `${mes} ${anio}`;
    case "anio":
      return `${anio}`;
    default:
      return fecha;
  }
}

// Formatear fecha SQL a formato DD/MM/YYYY sin problemas de timezone
// Recibe: "2025-12-01", "2025-12-01 00:00:00.000" o Date object
// Retorna: "01/12/2025"
export function formatearFechaSQL(fechaSQL) {
  if (!fechaSQL) return '-';

  let año, mes, dia;

  // Si es un objeto Date de JavaScript
  if (fechaSQL instanceof Date) {
    año = fechaSQL.getFullYear();
    mes = String(fechaSQL.getMonth() + 1).padStart(2, '0');
    dia = String(fechaSQL.getDate()).padStart(2, '0');
  } else {
    // Si es un string SQL
    const fechaStr = fechaSQL.toString();

    // Verificar si es formato ISO (YYYY-MM-DD)
    if (fechaStr.includes('-')) {
      const soloFecha = fechaStr.split(' ')[0];
      [año, mes, dia] = soloFecha.split('-');
    } else {
      // Si no se puede parsear, intentar crear Date y extraer
      const date = new Date(fechaSQL);
      if (!isNaN(date.getTime())) {
        año = date.getUTCFullYear();
        mes = String(date.getUTCMonth() + 1).padStart(2, '0');
        dia = String(date.getUTCDate()).padStart(2, '0');
      } else {
        return '-';
      }
    }
  }

  // Retornar en formato DD/MM/YYYY
  return `${dia}/${mes}/${año}`;
}