import { Hono } from "hono";
import { serve } from '@hono/node-server';
import { estatico } from "./config/static.js";
import { notFoundHandler, errorHandler } from "./config/handler.js";
import { loggerInicio } from './config/logger.js';
import { conectarDatabase, cerrarDatabase } from './config/database.js';
import { errorLoggerMiddleware } from './config/error-logger.js';
import rutas from "./routes/index.js";
import { logger } from "hono/logger";

const aplicacion = new Hono();

// Middlewares
aplicacion.use(logger());
aplicacion.use(errorLoggerMiddleware()); // Logger de errores a archivos
aplicacion.use('/*', estatico);

// Rutas
aplicacion.route('/', rutas);

// Manejadores de errores
aplicacion.notFound(notFoundHandler);
aplicacion.onError(errorHandler);

export async function iniciarServidor(host, puerto) {
  // Banner
  loggerInicio.banner();

  // Conectar a la base de datos
  await conectarDatabase();

  // Iniciar servidor
  serve({
    fetch: aplicacion.fetch,
    hostname: host,
    port: puerto
  });

  loggerInicio.servidorIniciado(host, puerto, process.env.NODE_ENV || 'development');

  // Manejo de señales de cierre
  const cerrarGracefully = async (signal) => {
    await cerrarDatabase();
    loggerInicio.servidorCerrado();
    process.exit(0);
  };

  process.on('SIGINT', cerrarGracefully);
  process.on('SIGTERM', cerrarGracefully);
}

export default aplicacion;