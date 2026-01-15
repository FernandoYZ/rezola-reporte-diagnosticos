import mssql from 'mssql';
import { obtenerPool } from '../config/database.js';

// función para ejecutarQuery solo para 4 parámetros (Codigo, FechaInicio, FechaFin, QUERY)
export async function ejecutarQuery(Codigo, FechaInicio, FechaFin, query) {
  const pool = obtenerPool();
  const resultado = await pool
    .request()
    .input("Codigo", mssql.VarChar(20), Codigo)
    .input("FechaInicio", mssql.DateTime, FechaInicio)
    .input("FechaFin", mssql.DateTime, FechaFin)
    .query(query);

  return resultado.recordset;
}

export async function ejecutarFecha(FechaInicio, FechaFin, query) {
  const pool = obtenerPool();
  const resultado = await pool
    .request()
    .input("FechaInicio", mssql.Date, FechaInicio)
    .input("FechaFin", mssql.Date, FechaFin)
    .query(query);

  return resultado.recordset;
}