/**
 * Componente de Autocomplete con Alpine.js
 * Busca diagnósticos por código CIE-10
 *
 * IMPORTANTE: El código seleccionado se usa con LIKE en el servidor
 * para buscar todos los diagnósticos que coincidan con ese código base.
 * Ejemplo: Si seleccionas "E11", buscará E11, E11.0, E11.1, E11.2, etc.
 */
export function autocomplete() {
  return {
    query: '',
    selectedId: '',
    selectedText: '',
    selectedIndex: -1,
    showResults: false,
    resultados: [],

    init() {
      // Usar $watch para observar cambios en 'query' y notificar al estado global
      this.$watch('query', value => {
        window.reporteState.codigoDiagnostico = value;
      });
    },

    async buscar() {
      if (this.query.length < 1) {
        this.resultados = [];
        return;
      }

      try {
        const response = await fetch(`/api/diagnosticos?buscar=${encodeURIComponent(this.query)}`);
        const data = await response.json();

        this.resultados = data;
        this.showResults = this.resultados.length > 0;
        this.selectedIndex = -1;
      } catch (error) {
        console.error('Error al buscar diagnósticos:', error);
        this.resultados = [];
      }
    },

    seleccionar(item) {
      // Guardar el código y mostrar solo el código en el input
      this.selectedId = item.CodigoDiagnostico;
      this.selectedText = item.Diagnostico;
      this.query = item.CodigoDiagnostico; // Solo el código en el input
      this.showResults = false;
      this.selectedIndex = -1;
    },

    navigateDown() {
      if (this.resultados.length === 0) return;
      this.selectedIndex = Math.min(this.selectedIndex + 1, this.resultados.length - 1);
    },

    navigateUp() {
      if (this.resultados.length === 0) return;
      this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
    },

    selectCurrent() {
      if (this.selectedIndex >= 0 && this.resultados[this.selectedIndex]) {
        this.seleccionar(this.resultados[this.selectedIndex]);
      }
    }
  }
}
