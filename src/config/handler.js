import { renderEta } from './template.js';
import { logError } from './error-logger.js';

export function notFoundHandler(c) {
  const html = renderEta('error', {
    titulo: 'Página no encontrada',
    codigo: 404,
    mensaje: 'La página que buscas no existe',
    descripcion: 'Verifica la URL o regresa al inicio'
  });
  return c.html(html, 404);
}

export function errorHandler(error, c) {
  // Registrar error en archivo log
  logError(error, {
    ruta: c.req.path,
    metodo: c.req.method,
    url: c.req.url
  });

  const html = renderEta('error', {
    titulo: 'Error del servidor',
    codigo: 500,
    mensaje: 'Ocurrió un error en el servidor',
    descripcion: process.env.NODE_ENV === 'development' ? error.message : 'Intenta de nuevo más tarde'
  });
  return c.html(html, 500);
}
