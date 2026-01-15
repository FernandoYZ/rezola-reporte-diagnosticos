import { iniciarServidor } from './app.js';
import { loggerInicio } from './config/logger.js';
import { logError } from './config/error-logger.js';

process.loadEnvFile();

const HOST = process.env.HOST || 'localhost';
const PORT = parseInt(process.env.PORT || '3000');

// Capturar errores no manejados
process.on('uncaughtException', (error) => {
  logError(error, {
    tipo: 'uncaughtException',
    proceso: 'main'
  });
  loggerInicio.errorCritico('Error no manejado capturado', [error.message]);
  process.exit(1);
});

// Capturar rechazos de promesas no manejados
process.on('unhandledRejection', (reason, promise) => {
  logError(new Error(String(reason)), {
    tipo: 'unhandledRejection',
    proceso: 'main',
    promise: String(promise)
  });
  loggerInicio.errorCritico('Promesa rechazada no manejada', [String(reason)]);
  process.exit(1);
});

async function main() {
  try {
    await iniciarServidor(HOST, PORT);
  } catch (error) {
    logError(error, {
      tipo: 'startupError',
      proceso: 'main'
    });
    loggerInicio.errorCritico(error.message, [
      'Verifica que las variables de entorno estén configuradas correctamente',
      'Asegúrate de que el servidor de base de datos esté en ejecución',
      'Revisa que el puerto no esté siendo usado por otra aplicación'
    ]);
    process.exit(1);
  }
}

main();
