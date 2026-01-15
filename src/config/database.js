import sql from 'mssql';
import { loggerInicio } from '../config/logger.js';

process.loadEnvFile()

// Configuración de la base de datos desde variables de entorno
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 60000
  }
};

let pool = null;


export async function conectarDatabase() {
  try {
    // Validar que todas las variables de entorno estén definidas
    const requiredVars = ['DB_USER', 'DB_PASSWORD', 'DB_SERVER', 'DB_NAME'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(
        `Faltan las siguientes variables de entorno: ${missingVars.join(', ')}\n` +
        'Por favor, configura el archivo .env con los datos de conexión a la base de datos.'
      );
    }

    pool = await sql.connect(dbConfig);

    // Verificar la conexión con una consulta simple
    const result = await pool.request().query('select DB_NAME() AS BaseDatos');
    const BaseDatos = result.recordset[0].BaseDatos.split('\n')[0].trim();

    loggerInicio.baseDatos.conectado(BaseDatos);

    return pool;
  } catch (error) {
    loggerInicio.baseDatos.errorConexion(error.message);
    throw error;
  }
}


export function obtenerPool() {
  if (!pool) {
    throw new Error('No hay conexión a la base de datos. Llama a conectarDatabase() primero.');
  }
  return pool;
}


export async function cerrarDatabase() {
  if (pool) {
    try {
      await pool.close();
      pool = null;
      loggerInicio.baseDatos.desconectado();
    } catch (error) {
      loggerInicio.baseDatos.errorConexion(`Error al cerrar: ${error.message}`);
      throw error;
    }
  }
}

