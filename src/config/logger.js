import figlet from "figlet";

const NIVELES = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

const COLORES = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  // Colores de texto
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  white: '\x1b[37m'
};

// Configuración del logger según entorno
const configuracion = {
  entorno: process.env.NODE_ENV || 'development',
  mostrarColores: true, // Colores siempre habilitados
  nivelMinimo: process.env.NODE_ENV === 'production' ? NIVELES.INFO : NIVELES.DEBUG,
  mostrarDetalles: process.env.NODE_ENV === 'development'
};

// Aplicar color a texto
function aplicarColor(texto, color) {
  return `${color}${texto}${COLORES.reset}`;
}

// Crear separador visual
function separador(longitud = 55) {
  return aplicarColor('─'.repeat(longitud), COLORES.gray);
}

/**
 * Logger con niveles
 */
export const logger = {
  /**
   * Log de error
   */
  error(mensaje, detalles = null) {
    console.error(aplicarColor(`✗ ${mensaje}`, COLORES.red));
    if (detalles && configuracion.mostrarDetalles) {
      console.error(aplicarColor(`  → ${detalles}`, COLORES.red));
    }
  },

  /**
   * Log de advertencia
   */
  warn(mensaje, detalles = null) {
    console.warn(aplicarColor(`⚠ ${mensaje}`, COLORES.yellow));
    if (detalles && configuracion.mostrarDetalles) {
      console.warn(aplicarColor(`  → ${detalles}`, COLORES.gray));
    }
  },

  /**
   * Log de información
   */
  info(mensaje, detalles = null) {
    console.log(aplicarColor(`ℹ ${mensaje}`, COLORES.cyan));
    if (detalles && configuracion.mostrarDetalles) {
      console.log(aplicarColor(`  → ${detalles}`, COLORES.gray));
    }
  },

  /**
   * Log de éxito
   */
  success(mensaje, detalles = null) {
    console.log(aplicarColor(`✓ ${mensaje}`, COLORES.green));
    if (detalles && configuracion.mostrarDetalles) {
      console.log(aplicarColor(`  → ${detalles}`, COLORES.gray));
    }
  },
};

export const loggerInicio = {
  /**
   * Mostrar banner ASCII
   */
  banner(titulo = 'Diagnostico') {
    const banner = figlet.textSync(titulo, {
      font: 'Slant'
    });

    console.log(aplicarColor(banner, COLORES.cyan));
    console.log(separador());
    console.log(aplicarColor('          Sistema de Reporte de Diagnósticos', COLORES.yellow));
    console.log(separador());
  },

  /**
   * Log de conexión a base de datos
   */
  baseDatos: {

    /**
     * Conexión exitosa (solo en desarrollo)
     */
    conectado(baseDatos) {
      if (!configuracion.mostrarDetalles) return;

      console.log(aplicarColor('  ✓ Conexión a la base de datos establecida', COLORES.green));
      console.log(aplicarColor(`     → Base de datos: ${baseDatos}`, COLORES.gray));
      console.log('');
    },

    /**
     * Error de conexión
     */
    errorConexion(mensaje) {
      logger.error('Error al conectar con la base de datos', mensaje);
    },

    /**
     * Desconexión
     */
    desconectado() {
      console.log(aplicarColor('  ✓ Conexión a la base de datos cerrada', COLORES.yellow));
    }
  },

  /**
   * Log de servidor iniciado
   */
  servidorIniciado(host, puerto, entorno, pid = process.pid) {
    const url = `http://${host}:${puerto}`;

    console.log(aplicarColor('  INFO', COLORES.green), aplicarColor(`      URL Local`, COLORES.gray), aplicarColor(`     ${url}`, COLORES.white));
    console.log(aplicarColor('  INFO', COLORES.green), aplicarColor(`      PID`, COLORES.gray), aplicarColor(`           ${pid}`, COLORES.white));

    if (configuracion.mostrarDetalles) {
      console.log(aplicarColor('  INFO', COLORES.green), aplicarColor(`     Entorno`, COLORES.gray), aplicarColor(`     ${entorno}`, COLORES.white));
    }

    console.log(separador());
    console.log('');
  },

  /**
   * Log de servidor cerrado
   */
  servidorCerrado() {
    console.log(aplicarColor('  ✓ Servidor cerrado correctamente', COLORES.green));
    console.log(separador());
    console.log('');
  },

  /**
   * Log de error crítico
   */
  errorCritico(mensaje, sugerencias = []) {
    console.log('');
    console.log(separador());
    console.log(aplicarColor('  ✗ ERROR CRÍTICO: No se pudo iniciar el servidor', COLORES.red));
    console.log(aplicarColor(`  → Razón: ${mensaje}`, COLORES.red));

    if (sugerencias.length > 0) {
      console.log('');
      console.log(aplicarColor('  💡 Solución:', COLORES.yellow));
      sugerencias.forEach((sugerencia, index) => {
        console.log(aplicarColor(`     ${index + 1}. ${sugerencia}`, COLORES.gray));
      });
    }

    console.log(separador());
    console.log('');
  }
};

export function Logger(nombre) {
  return {
    error: (msg, det) => logger.error(`[${nombre}] ${msg}`, det),
    warn: (msg, det) => logger.warn(`[${nombre}] ${msg}`, det),
    info: (msg, det) => logger.info(`[${nombre}] ${msg}`, det),
    success: (msg, det) => logger.success(`[${nombre}] ${msg}`, det),
    debug: (msg, det) => logger.debug(`[${nombre}] ${msg}`, det)
  };
}
