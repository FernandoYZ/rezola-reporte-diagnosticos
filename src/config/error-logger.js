import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio de logs
const LOG_DIR = path.join(__dirname, '../../tmp');

// Asegurar que el directorio existe
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Obtener fecha actual en formato YYYY-MM-DD
function getFechaActual() {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

// Obtener timestamp completo
function getTimestamp() {
  return new Date().toISOString();
}

// Formatear error para el log
function formatearError(error, contexto = {}) {
  const entrada = {
    timestamp: getTimestamp(),
    tipo: error.name || 'Error',
    mensaje: error.message,
    stack: error.stack,
    contexto
  };

  return JSON.stringify(entrada, null, 2) + '\n---\n';
}

// Escribir error en archivo log
export function logError(error, contexto = {}) {
  try {
    const fecha = getFechaActual();
    const archivoLog = path.join(LOG_DIR, `error-${fecha}.log`);
    const contenido = formatearError(error, contexto);

    fs.appendFileSync(archivoLog, contenido, 'utf8');

    // También mostrar en consola en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      console.error('\n❌ Error capturado:');
      console.error(contenido);
    }
  } catch (err) {
    console.error('Error al escribir en el log:', err);
  }
}

// Middleware para capturar errores no manejados
export function errorLoggerMiddleware() {
  return async (c, next) => {
    try {
      await next();
    } catch (error) {
      // Registrar el error
      logError(error, {
        ruta: c.req.path,
        metodo: c.req.method,
        query: c.req.query(),
        headers: Object.fromEntries(c.req.header())
      });

      // Retornar respuesta de error
      return c.json({
        error: 'Error interno del servidor',
        mensaje: process.env.NODE_ENV === 'production'
          ? 'Ha ocurrido un error inesperado'
          : error.message
      }, 500);
    }
  };
}
