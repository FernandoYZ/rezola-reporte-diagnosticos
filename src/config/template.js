import { Eta } from 'eta';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar Eta
export const eta = new Eta({
  views: path.join(__dirname, '../views'),
  cache: process.env.NODE_ENV === 'production',
  useWith: true
});

// Helper para renderizar iconos
function iconHelper(name, options = {}) {
  const defaultOptions = {
    class: 'w-6 h-6',
    size: 24,
    strokeWidth: 2,
    ariaLabel: name
  };
  const iconOptions = { ...defaultOptions, ...options };
  return eta.render(`components/icons/${name}.eta`, iconOptions);
}

// Helper para renderizar vistas con layout
export function renderEta(plantilla, datos = {}, layout = 'default') {
  // Agregar helper de iconos a los datos
  const datosConHelpers = {
    ...datos,
    icon: iconHelper
  };

  const contenido = eta.render(`pages/${plantilla}`, datosConHelpers);

  return eta.render(`layouts/${layout}`, {
    ...datosConHelpers,
    contenido
  });
}
