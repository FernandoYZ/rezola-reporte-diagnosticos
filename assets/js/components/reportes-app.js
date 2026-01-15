/**
 * Componente Alpine.js para la Página de Reportes
 * Maneja únicamente el filtro de fechas (sin búsqueda por código de diagnóstico)
 * Server-first: HTMX maneja toda la carga de datos desde el servidor
 */
export function reportesApp(periodoInicial) {
  return {
    // Estado UI de los controles del formulario
    // Por defecto: mode='custom' con últimos 7 días
    mode: 'custom',
    año: '2025',
    mes: '0',
    trimestre: '0',
    semestre: '0',

    // Fechas personalizadas (últimos 7 días por defecto)
    fechaInicio: periodoInicial?.fechaInicio || '2025-01-01',
    fechaFin: periodoInicial?.fechaFin || '2025-01-31',

    // Estado UI del sidebar móvil
    sidebarOpen: false,

    init() {
      // No necesitamos cargar nada manualmente aquí
      // HTMX maneja la carga inicial con hx-trigger="load" en el HTML
    },

    // Toggle del sidebar móvil
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },

    // Obtener parámetros del formulario según el modo actual
    getFormParams() {
      const params = { mode: this.mode };

      if (this.mode === 'mes') {
        params.año = this.año;
        params.mes = this.mes;
      } else if (this.mode === 'trimestre') {
        params.año = this.año;
        params.trimestre = this.trimestre;
      } else if (this.mode === 'semestre') {
        params.año = this.año;
        params.semestre = this.semestre;
      } else if (this.mode === 'año') {
        params.año = this.año;
      } else if (this.mode === 'custom') {
        params.fechaInicio = this.fechaInicio;
        params.fechaFin = this.fechaFin;
      }

      return params;
    },

    // Cargar tablas usando HTMX con parámetros de fecha
    cargarTablas() {
      // Construir parámetros según el modo
      const params = this.getFormParams();

      // Construir URL con parámetros
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/datos-tablas?${queryString}`;

      // Usar HTMX para hacer la petición
      htmx.ajax('GET', url, {
        target: '#tablas-container',
        indicator: '#loading-indicator'
      });

      // Cerrar sidebar en móvil
      this.sidebarOpen = false;
    },

    // Computed property para preview visual del período en el header
    get dateLabel() {
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

      if (this.mode === 'mes') {
        return `${meses[this.mes]} ${this.año}`;
      }
      if (this.mode === 'trimestre') {
        return `Trimestre ${['I', 'II', 'III', 'IV'][parseInt(this.trimestre)]} - ${this.año}`;
      }
      if (this.mode === 'semestre') {
        return `Semestre ${['I', 'II'][parseInt(this.semestre)]} - ${this.año}`;
      }
      if (this.mode === 'año') {
        return `Año ${this.año}`;
      }
      return `${this.fechaInicio} - ${this.fechaFin}`;
    },

    // Exportar datos a Excel
    exportarExcel() {
      const params = new URLSearchParams({ mode: this.mode });

      // Solo agregar parámetros relevantes según el modo
      if (this.mode === 'mes') {
        params.append('año', this.año);
        params.append('mes', this.mes);
      } else if (this.mode === 'trimestre') {
        params.append('año', this.año);
        params.append('trimestre', this.trimestre);
      } else if (this.mode === 'semestre') {
        params.append('año', this.año);
        params.append('semestre', this.semestre);
      } else if (this.mode === 'año') {
        params.append('año', this.año);
      } else if (this.mode === 'custom') {
        params.append('fechaInicio', this.fechaInicio);
        params.append('fechaFin', this.fechaFin);
      }

      // Abrir en nueva ventana para descargar
      window.open(`/api/exportar-tablas?${params.toString()}`, '_blank');
    },

    // Construir query string para las búsquedas de tablas
    getTableSearchParams(searchParam, searchValue) {
      const params = this.getFormParams();
      params[searchParam] = searchValue || '';
      return new URLSearchParams(params).toString();
    }
  }
}
