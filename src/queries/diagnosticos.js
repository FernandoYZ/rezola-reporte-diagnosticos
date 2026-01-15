// src/queries/diagnosticos.js
import mssql from 'mssql'
import { obtenerPool } from '../config/database.js'

export const BUSCAR_CODIGO_DIAGNOSTICO = `
  -- DECLARE @buscar   VARCHAR(10) = '';
  -- DECLARE @cantidad INT = 15;
  -- DECLARE @pagina   INT = 1;
  DECLARE @offset   INT = (@pagina - 1) * @cantidad;
  
  SELECT
      RTRIM(CodigoCIE10) as CodigoDiagnostico,
      LTRIM(RTRIM(Descripcion)) AS Diagnostico
  FROM Diagnosticos
  WHERE
      CodigoCIE2004 IS NOT NULL
      AND Descripcion IS NOT NULL
      AND (
          @buscar = ''
          OR CodigoCIE2004 LIKE @buscar + '%'
      )
  ORDER BY 
      CodigoCIE2004
  OFFSET @offset ROWS
  FETCH NEXT @cantidad ROWS ONLY;
`;

export const OBTENER_KPI_RANGO_FECHA_CODIGO = `
  DECLARE @FechaInicioAnterior DATE = DATEADD(DAY, -DATEDIFF(DAY, @FechaInicio, @FechaFin) - 1, @FechaInicio);
  
  WITH AtencionesBase AS (
    SELECT
      a.IdAtencion,
      a.IdPaciente,
      p.IdDistritoProcedencia,
      a.FechaIngreso
    FROM Atenciones a
    INNER JOIN AtencionesDiagnosticos ad ON a.IdAtencion = ad.IdAtencion
    INNER JOIN Diagnosticos d ON ad.IdDiagnostico = d.IdDiagnostico
      AND d.CodigoCIE10 LIKE @Codigo + '%'
    INNER JOIN Pacientes p ON a.IdPaciente = p.IdPaciente
    WHERE 
      a.FechaEgreso IS NOT NULL
      AND a.FyHFinal IS NOT NULL
      AND a.FechaIngreso >= @FechaInicioAnterior
      AND a.FechaIngreso <  DATEADD(DAY, 1, @FechaFin)
  ),
  Resumen AS (
    SELECT
      COUNT(DISTINCT CASE 
        WHEN FechaIngreso >= @FechaInicio THEN IdPaciente 
      END) AS PacientesActual,

      COUNT(DISTINCT CASE 
        WHEN FechaIngreso < @FechaInicio THEN IdPaciente 
      END) AS PacientesAnterior,

      COUNT(DISTINCT CASE 
        WHEN FechaIngreso >= @FechaInicio THEN IdAtencion 
      END) AS AtencionesActual,

      COUNT(DISTINCT CASE 
        WHEN FechaIngreso < @FechaInicio THEN IdAtencion 
      END) AS AtencionesAnterior
    FROM AtencionesBase
  ),
  Distritos AS (
    SELECT
      COUNT(DISTINCT CASE 
        WHEN FechaIngreso >= @FechaInicio THEN IdDistritoProcedencia 
      END) AS DistritosActual,

      COUNT(DISTINCT CASE 
        WHEN FechaIngreso < @FechaInicio THEN IdDistritoProcedencia 
      END) AS DistritosAnterior
    FROM AtencionesBase
  )
  SELECT
    d.DistritosActual,
    d.DistritosAnterior,
    d.DistritosActual - d.DistritosAnterior AS DiferenciaDistritos,

    r.PacientesActual,
    r.PacientesAnterior,
    CASE 
      WHEN r.PacientesAnterior > 0 
      THEN (r.PacientesActual - r.PacientesAnterior) * 100.0 / r.PacientesAnterior
      ELSE 100 
    END AS VariacionPacientes,

    r.AtencionesActual,
    r.AtencionesAnterior,
    CASE 
      WHEN r.AtencionesAnterior > 0 
      THEN (r.AtencionesActual - r.AtencionesAnterior) * 100.0 / r.AtencionesAnterior
      ELSE 100 
    END AS VariacionAtenciones,

    CASE 
      WHEN r.PacientesActual > 0 
      THEN r.AtencionesActual * 1.0 / r.PacientesActual
      ELSE 0 
    END AS RatioReincidencia
  FROM Resumen r
  CROSS JOIN Distritos d;
`;

export const GRAFICO_PIRAMIDE_PACIENTES = `
  WITH RangoEdadCalculado AS (
      SELECT 
          a.IdPaciente,
          a.Edad,
          p.IdTipoSexo,
          te.Codigo,
          CASE 
              WHEN (te.Codigo = 'A' AND a.Edad BETWEEN 0 AND 5) THEN '0-5'
              WHEN (te.Codigo = 'A' AND a.Edad BETWEEN 6 AND 11) THEN '6-11'
              WHEN (te.Codigo = 'A' AND a.Edad BETWEEN 12 AND 17) THEN '12-17'
              WHEN (te.Codigo = 'A' AND a.Edad BETWEEN 18 AND 29) THEN '18-29'
              WHEN (te.Codigo = 'A' AND a.Edad BETWEEN 30 AND 59) THEN '30-59'
              WHEN (te.Codigo = 'A' AND a.Edad >= 60) THEN '60+'
              
              WHEN (te.Codigo = 'M' AND a.Edad / 12 BETWEEN 0 AND 5) THEN '0-5'
              WHEN (te.Codigo = 'M' AND a.Edad / 12 BETWEEN 6 AND 11) THEN '6-11'
              WHEN (te.Codigo = 'M' AND a.Edad / 12 BETWEEN 12 AND 17) THEN '12-17'
              WHEN (te.Codigo = 'M' AND a.Edad / 12 BETWEEN 18 AND 29) THEN '18-29'
              WHEN (te.Codigo = 'M' AND a.Edad / 12 BETWEEN 30 AND 59) THEN '30-59'
              WHEN (te.Codigo = 'M' AND a.Edad / 12 >= 60) THEN '60+'
  
              WHEN (te.Codigo = 'D' AND a.Edad / 365 BETWEEN 0 AND 5) THEN '0-5'
              WHEN (te.Codigo = 'D' AND a.Edad / 365 BETWEEN 6 AND 11) THEN '6-11'
              WHEN (te.Codigo = 'D' AND a.Edad / 365 BETWEEN 12 AND 17) THEN '12-17'
              WHEN (te.Codigo = 'D' AND a.Edad / 365 BETWEEN 18 AND 29) THEN '18-29'
              WHEN (te.Codigo = 'D' AND a.Edad / 365 BETWEEN 30 AND 59) THEN '30-59'
              WHEN (te.Codigo = 'D' AND a.Edad / 365 >= 60) THEN '60+'
  
              WHEN (te.Codigo = 'H' AND a.Edad / 8760 BETWEEN 0 AND 5) THEN '0-5'
              WHEN (te.Codigo = 'H' AND a.Edad / 8760 BETWEEN 6 AND 11) THEN '6-11'
              WHEN (te.Codigo = 'H' AND a.Edad / 8760 BETWEEN 12 AND 17) THEN '12-17'
              WHEN (te.Codigo = 'H' AND a.Edad / 8760 BETWEEN 18 AND 29) THEN '18-29'
              WHEN (te.Codigo = 'H' AND a.Edad / 8760 BETWEEN 30 AND 59) THEN '30-59'
              WHEN (te.Codigo = 'H' AND a.Edad / 8760 >= 60) THEN '60+'
              ELSE 'Desconocido'
          END AS RangoEdad
      FROM Atenciones a
      INNER JOIN AtencionesDiagnosticos ad ON a.IdAtencion = ad.IdAtencion
      INNER JOIN Pacientes p ON a.IdPaciente = p.IdPaciente
      INNER JOIN TiposEdad te ON a.IdTipoEdad = te.IdTipoEdad
      inner join Diagnosticos di on ad.IdDiagnostico = di.IdDiagnostico
        AND di.CodigoCIE10 LIKE @Codigo + '%'
      WHERE a.FechaIngreso >= @FechaInicio
      AND a.FechaIngreso < DATEADD(DAY, 1, @FechaFin)
      AND a.FechaEgreso IS NOT NULL
      AND a.FyHFinal IS NOT NULL
  )
  
  SELECT 
      RangoEdad,
      COUNT(DISTINCT CASE WHEN IdTipoSexo = 1 THEN IdPaciente END) AS Masculino,
      COUNT(DISTINCT CASE WHEN IdTipoSexo = 2 THEN IdPaciente END) AS Femenino
  FROM RangoEdadCalculado
  GROUP BY RangoEdad
  ORDER BY RangoEdad
`;

export const TABLA_DIAGNOSTICOS = `
  SELECT
    RTRIM(d.CodigoCIE10) AS CodigoDiagnostico, 
    RTRIM(d.Descripcion) AS Diagnostico,
    COUNT(DISTINCT a.IdAtencion) AS Cantidad
  FROM Atenciones a
  INNER JOIN AtencionesDiagnosticos ad 
    ON a.IdAtencion = ad.IdAtencion
  INNER JOIN Diagnosticos d 
    ON ad.IdDiagnostico = d.IdDiagnostico
    AND d.CodigoCIE10 LIKE @Codigo + '%'
  WHERE a.FechaIngreso >= @FechaInicio
    AND a.FechaIngreso < DATEADD(DAY, 1, @FechaFin)
    AND a.FechaEgreso IS NOT NULL
    AND a.FyHFinal IS NOT NULL
  GROUP BY 
    d.CodigoCIE10,
    d.Descripcion
  ORDER BY 
    Cantidad DESC; 
`;

export const TABLA_RANKING_INCIDENCIAS_PROVINCIAS = `
  WITH AtencionesPorDistrito AS ( 
    SELECT
      di.Nombre,
      COUNT(*) AS CantidadAtenciones
    FROM Atenciones a
    INNER JOIN AtencionesDiagnosticos ad ON a.IdAtencion = ad.IdAtencion
    INNER JOIN Diagnosticos d ON ad.IdDiagnostico = d.IdDiagnostico
        AND d.CodigoCIE10 LIKE @Codigo + '%'
    INNER JOIN Pacientes p ON a.IdPaciente = p.IdPaciente
    INNER JOIN Distritos di ON p.IdDistritoProcedencia = di.IdDistrito
    WHERE a.FechaIngreso >= @FechaInicio
      AND a.FechaIngreso < DATEADD(DAY, 1, @FechaFin)
      AND a.FechaEgreso IS NOT NULL
      AND a.FyHFinal IS NOT NULL
      AND di.IdProvincia = 1505 -- Solo Cañete
    GROUP BY di.Nombre
  )
  SELECT TOP 5
    Nombre as NombreDistrito,
    CantidadAtenciones,
    CAST(
      CantidadAtenciones * 100.0 / SUM(CantidadAtenciones) OVER ()
      AS DECIMAL(5,2)
    ) AS PorcentajeCorrespondiente
  FROM AtencionesPorDistrito
  ORDER BY CantidadAtenciones DESC;
`;

export const GRAFICO_TIPO_FINANCIAMIENTO = `
  SELECT 
    ff.Descripcion AS FuenteFinanciamiento,
    COUNT(DISTINCT a.IdAtencion) AS CantidadAtenciones
  FROM Atenciones a
  INNER JOIN AtencionesDiagnosticos ad ON a.IdAtencion = ad.IdAtencion
  INNER JOIN Diagnosticos d ON ad.IdDiagnostico = d.IdDiagnostico
    AND d.CodigoCIE10 LIKE @Codigo + '%'
  INNER JOIN FuentesFinanciamiento ff ON a.IdFuenteFinanciamiento = ff.IdFuenteFinanciamiento
  WHERE 
    a.FechaIngreso >= @FechaInicio
    AND a.FechaIngreso < DATEADD(DAY, 1, @FechaFin)
    AND a.FechaEgreso IS NOT NULL
    AND a.FyHFinal IS NOT NULL
  GROUP BY 
    ff.IdFuenteFinanciamiento,
    ff.Descripcion
  ORDER BY 
    CantidadAtenciones DESC;
`;

export const GRAFICO_CONDICION_PACIENTE = `
  SELECT 
    tp.Descripcion AS CondicionPaciente,
    COUNT(DISTINCT a.IdAtencion) AS CantidadAtenciones
  FROM Atenciones a
  INNER JOIN AtencionesDiagnosticos ad ON a.IdAtencion = ad.IdAtencion
  INNER JOIN Diagnosticos d ON ad.IdDiagnostico = d.IdDiagnostico
    AND d.CodigoCIE10 LIKE @Codigo + '%'
  inner join TiposCondicionPaciente tp on a.IdTipoCondicionAlServicio = tp.IdTipoCondicionPaciente
  WHERE 
    a.FechaIngreso >= @FechaInicio
    AND a.FechaIngreso < DATEADD(DAY, 1, @FechaFin)
    AND a.FechaEgreso IS NOT NULL
    AND a.FyHFinal IS NOT NULL
  GROUP BY 
    tp.Descripcion
  ORDER BY 
    CantidadAtenciones DESC;
`;

export const GRAFICO_CLASIFICACION_DIAGNOSTICO = `
  SELECT 
    sd.Descripcion AS ClasificacionDiagnostico,
    COUNT(DISTINCT a.IdAtencion) AS CantidadAtenciones
  FROM Atenciones a
  INNER JOIN AtencionesDiagnosticos ad ON a.IdAtencion = ad.IdAtencion
  INNER JOIN Diagnosticos d ON ad.IdDiagnostico = d.IdDiagnostico
    AND d.CodigoCIE10 LIKE @Codigo + '%'
  inner join SubclasificacionDiagnosticos sd on ad.IdSubclasificacionDx = sd.IdSubclasificacionDx
  WHERE 
    a.FechaIngreso >= @FechaInicio
    AND a.FechaIngreso < DATEADD(DAY, 1, @FechaFin)
    AND a.FechaEgreso IS NOT NULL
    AND a.FyHFinal IS NOT NULL
  GROUP BY 
    sd.Descripcion
  ORDER BY 
    CantidadAtenciones DESC;
`;

// Gráfico de Tendencia
export const CANTIDADES_ATENCIONES_POR_DIA = `
  SELECT 
  	CAST(a.FechaIngreso AS DATE) AS Fecha,
  	COUNT(a.IdAtencion) AS CantidadAtenciones
  FROM Atenciones a INNER JOIN AtencionesDiagnosticos ad ON a.IdAtencion = ad.IdAtencion
  INNER JOIN Diagnosticos d ON ad.IdDiagnostico = d.IdDiagnostico
    AND d.CodigoCIE10 LIKE @Codigo + '%' 
  WHERE 
  	a.FechaIngreso >= @FechaInicio
  	AND a.FechaIngreso < DATEADD(DAY, 1, @FechaFin)
  	AND a.FechaEgreso IS NOT NULL
  	AND a.FyHFinal IS NOT NULL
  GROUP BY CAST(a.FechaIngreso AS DATE)
  ORDER BY Fecha;
`;

export const CANTIDADES_ATENCIONES_POR_SEMANA = `
  SET DATEFIRST 1; -- lunes
  
  SELECT 
    DATEADD(
      DAY,
      1 - DATEPART(WEEKDAY, a.FechaIngreso),
      CAST(a.FechaIngreso AS DATE)
    ) AS InicioSemana,
    COUNT(DISTINCT a.IdAtencion) AS CantidadAtenciones
  FROM Atenciones a
  INNER JOIN AtencionesDiagnosticos ad 
    ON a.IdAtencion = ad.IdAtencion
  INNER JOIN Diagnosticos d 
    ON ad.IdDiagnostico = d.IdDiagnostico
    AND d.CodigoCIE10 LIKE @Codigo + '%'
  WHERE 
    a.FechaIngreso >= @FechaInicio
    AND a.FechaIngreso < DATEADD(DAY, 1, @FechaFin)
    AND a.FechaEgreso IS NOT NULL
    AND a.FyHFinal IS NOT NULL
  GROUP BY 
    DATEADD(
      DAY,
      1 - DATEPART(WEEKDAY, a.FechaIngreso),
      CAST(a.FechaIngreso AS DATE)
    )
  ORDER BY InicioSemana;
`;

export const CANTIDADES_ATENCIONES_POR_MES = `
  SELECT 
    DATEFROMPARTS(
      YEAR(a.FechaIngreso),
      MONTH(a.FechaIngreso),
      1
    ) AS InicioMes,
    COUNT(DISTINCT a.IdAtencion) AS CantidadAtenciones
  FROM Atenciones a
  INNER JOIN AtencionesDiagnosticos ad ON a.IdAtencion = ad.IdAtencion
  INNER JOIN Diagnosticos d ON ad.IdDiagnostico = d.IdDiagnostico
    AND d.CodigoCIE10 LIKE @Codigo + '%'
  WHERE 
    a.FechaIngreso >= @FechaInicio
    AND a.FechaIngreso <  DATEADD(DAY, 1, @FechaFin)
    AND a.FechaEgreso IS NOT NULL
    AND a.FyHFinal IS NOT NULL
  GROUP BY 
    DATEFROMPARTS(
      YEAR(a.FechaIngreso),
      MONTH(a.FechaIngreso),
      1
    )
  ORDER BY InicioMes;
`;

export const CANTIDADES_ATENCIONES_POR_ANIO = `
  SELECT 
      DATEFROMPARTS(YEAR(a.FechaIngreso), 1, 1) AS InicioAnio,
      COUNT(DISTINCT a.IdAtencion) AS CantidadAtenciones
  FROM Atenciones a
  INNER JOIN AtencionesDiagnosticos ad ON a.IdAtencion = ad.IdAtencion
  INNER JOIN Diagnosticos d ON ad.IdDiagnostico = d.IdDiagnostico
      AND d.CodigoCIE10 LIKE @Codigo + '%'
  WHERE 
      a.FechaIngreso >= @FechaInicio
      AND a.FechaIngreso <  DATEADD(DAY, 1, @FechaFin)
      AND a.FechaEgreso IS NOT NULL
      AND a.FyHFinal IS NOT NULL
  GROUP BY DATEFROMPARTS(YEAR(a.FechaIngreso), 1, 1)
  ORDER BY InicioAnio;
`;

// ==================== //
//   FORMATO DE TABLAS  //
// ==================== //
 
export const TABLA_FEBRILES = `
  DECLARE @localInicio DATE = @FechaInicio;
  DECLARE @localFin DATE = @FechaFin;

  select distinct
    d.CodigoCIE10,
    d.Descripcion,
    a.IdAtencion,
    CONVERT(VARCHAR(10), a.FechaIngreso, 120) as FechaIngreso,
    p.ApellidoPaterno+' '+p.ApellidoMaterno+' '+p.PrimerNombre as paciente,
    a.Edad,
    td.Descripcion as TipoEdad,
    p.NroDocumento,
    p.DireccionDomicilio as domicilio,
    di.Nombre as distrito,
    p.Telefono as Celular
  from AtencionesDiagnosticos at
  inner join Atenciones a on a.IdAtencion=at.IdAtencion
  inner join Diagnosticos d on d.IdDiagnostico=at.IdDiagnostico
  inner join TiposServicio tp on tp.IdTipoServicio=a.IdTipoServicio
  inner join Pacientes p on p.IdPaciente=a.IdPaciente
  left join Distritos di on di.IdDistrito=p.IdDistritoProcedencia
  left join TiposEdad td on td.IdTipoEdad=a.IdTipoEdad
  where a.FechaIngreso between @localInicio and @localFin and
  tp.IdTipoServicio in (2)
  and d.CodigoCIE10 like  '%r50%'
`;

export const TABLA_IRAS = `
  DECLARE @localInicio DATE = @FechaInicio;
  DECLARE @localFin DATE = @FechaFin;

  select distinct
    d.Descripcion,
    a.IdAtencion,
    p.ApellidoPaterno+' '+p.ApellidoMaterno+' '+p.PrimerNombre as paciente,
    a.Edad,
    td.Descripcion as TipoEdad,
    p.NroDocumento,
    p.DireccionDomicilio as domicilio,
    di.Nombre as distrito,
    p.Telefono as Celular
  from AtencionesDiagnosticos at
  inner join Atenciones a on a.IdAtencion=at.IdAtencion
  inner join Diagnosticos d on d.IdDiagnostico=at.IdDiagnostico
  inner join TiposServicio tp on tp.IdTipoServicio=a.IdTipoServicio
  inner join Pacientes p on p.IdPaciente=a.IdPaciente
  left join Distritos di on di.IdDistrito=p.IdDistritoProcedencia
  left join TiposEdad td on td.IdTipoEdad=a.IdTipoEdad
  where a.FechaIngreso between @localInicio and @localFin and
  tp.IdTipoServicio in (2)
  and d.CodigoCIE10 like '%j%'
  --and a.IdTipoEdad=1
  and a.Edad<=4
`;

export const TABLA_EDAS = `
  DECLARE @localInicio DATE = @FechaInicio;
  DECLARE @localFin DATE = @FechaFin;

  select distinct
    d.CodigoCIE10,
    d.Descripcion,
    a.IdAtencion,
    p.ApellidoPaterno+' '+p.ApellidoMaterno+' '+p.PrimerNombre as paciente,
    a.Edad,
    td.Descripcion as TipoEdad,
    p.NroDocumento,
    p.DireccionDomicilio as domicilio,
    di.Nombre as distrito,
    p.Telefono as Celular
  from AtencionesDiagnosticos at
  inner join Atenciones a on a.IdAtencion=at.IdAtencion
  inner join Diagnosticos d on d.IdDiagnostico=at.IdDiagnostico
  inner join TiposServicio tp on tp.IdTipoServicio=a.IdTipoServicio
  inner join Pacientes p on p.IdPaciente=a.IdPaciente
  left join Distritos di on di.IdDistrito=p.IdDistritoProcedencia
  left join TiposEdad td on td.IdTipoEdad=a.IdTipoEdad
  where a.FechaIngreso between @localInicio and @localFin and
  tp.IdTipoServicio in (2)
  and d.CodigoCIE10 like  '%a09%'
`;

export const TABLA_TOTAL_ATENCIONES = `
  DECLARE @localInicio DATE = @FechaInicio;
  DECLARE @localFin DATE = @FechaFin;
  select  
    a.FechaIngreso, 
    count (DISTINCT a.IdAtencion) Total 
  from AtencionesDiagnosticos at
  inner join Atenciones a on a.IdAtencion=at.IdAtencion
  inner join Diagnosticos d on d.IdDiagnostico=at.IdDiagnostico
  inner join TiposServicio tp on tp.IdTipoServicio=a.IdTipoServicio 
  inner join Pacientes p on p.IdPaciente=a.IdPaciente
  where a.FechaIngreso between @localInicio and @localFin and 
  tp.IdTipoServicio in (2) 
  group by a.FechaIngreso
`;

export const TABLA_INFORMACION_PERSONAL = `
  DECLARE @localInicio DATE = @FechaInicio;
  DECLARE @localFin DATE = @FechaFin;
  
  select distinct
    d.CodigoCIE10,
    d.Descripcion,
    a.IdAtencion,
    CONVERT(VARCHAR(10), a.FechaIngreso, 120) as FechaIngreso,
    p.ApellidoPaterno+' '+p.ApellidoMaterno+' '+p.PrimerNombre as paciente,
    a.Edad,
    td.Descripcion as TipoEdad,
    p.NroDocumento,
    p.DireccionDomicilio as domicilio,
    di.Nombre as distrito,
    p.Telefono as Celular
  from AtencionesDiagnosticos at
  inner join Atenciones a on a.IdAtencion=at.IdAtencion
  inner join Diagnosticos d on d.IdDiagnostico=at.IdDiagnostico
  inner join TiposServicio tp on tp.IdTipoServicio=a.IdTipoServicio
  inner join Pacientes p on p.IdPaciente=a.IdPaciente
  left join Distritos di on di.IdDistrito=p.IdDistritoProcedencia
  left join TiposEdad td on td.IdTipoEdad=a.IdTipoEdad
  where a.FechaIngreso between @localInicio and @localFin and
  tp.IdTipoServicio in (2)
  and at.IdDiagnostico in (1,2,3,35,79,97,99,102,111,112,113,114,115,116,135,136,137,160,162,163,
  164,165,166,167,168,169,170,171,172,174,206,207,306,323,324,325,333,365,402,403,404,405,406,414,416,
  417,418,419,420,421,422,423,424,425,437,438,439,440,604,605,606,607,608,609,610,611,612,618,624,625,
  626,627,628,629,651,656,1021,2659,2812,3553,3554,3555,9701,9722,9723,9724,9725,9726,9727,9728,9729,
  9730,9731,9877,10049,10050,10051,10052,10053,10054,10055,10056,12320,12321,12322,12323,12324,12325,
  12326,12327,12328,12329,12347,12348,12349,12350,12351,12352,12353,12515,13850,13860,13862,13870,13871,
  13872,13873,13874,13875,13876,13877,13878,13879,14410,14411,14412,14413,14414,14415,14416,14417,14418,
  14419,14420,14421,14422,14423,14424,14425,14426,14427,14428,14429,50051,50142,50143,50144,50145,50146,
  50147,50465,50466,50467,50468,50469,50723,50724,50725,50726,50727,50728,50729,50730,50844,50921,50990,50992,
  50993,13860,13861,13862,13863,13864,13865,13866,13867,13868,13869,13894,13100,13101,13102,13103,13104,13105,13106,
  13107,13108)
`;


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
    .input("FechaInicio", mssql.DateTime, FechaInicio)
    .input("FechaFin", mssql.DateTime, FechaFin)
    .query(query);

  return resultado.recordset;
}

export async function ejecutarEncontrarCodigo(buscar, pagina = 1, cantidad = 15) {
  const pool = obtenerPool()
  const result = await pool
    .request()
    .input("buscar", mssql.VarChar(10), buscar || "")
    .input("pagina", mssql.Int, pagina)
    .input("cantidad", mssql.Int, cantidad)
    .query(BUSCAR_CODIGO_DIAGNOSTICO);

  return result.recordset;
}
