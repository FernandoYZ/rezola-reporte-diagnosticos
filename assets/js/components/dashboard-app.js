/**
 * Componente Alpine.js para el Dashboard
 * Este componente maneja únicamente el estado UI básico
 * La lógica de negocio (cálculo de fechas, fetch de datos) se maneja en el servidor
 */
export function dashboardApp(periodoInicial) {
  return {
    // Estado UI de los controles del formulario
    mode: 'mes',
    año: periodoInicial?.año || '2025',
    mes: periodoInicial?.mes || '0',
    trimestre: '0',
    semestre: '0',

    // Fechas personalizadas (solo para modo custom)
    fechaInicio: periodoInicial?.fechaInicio || '2025-01-01',
    fechaFin: periodoInicial?.fechaFin || '2025-01-31',

    // Estado UI del sidebar móvil
    sidebarOpen: false,

    init() {
      // Solo cerrar sidebar al hacer clic fuera en mobile
      // El resto de la lógica la maneja HTMX
    },

    // Toggle del sidebar móvil
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },

    // Obtener parámetros del formulario según el modo actual
    // Esto evita enviar parámetros irrelevantes que causan conflictos
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

    // Generar reporte usando HTMX con parámetros correctos
    generarReporte() {
      // Obtener código del input hidden
      const codigoInput = document.querySelector('input[name="Codigo"]');
      const codigo = codigoInput ? codigoInput.value : '';

      if (!codigo || codigo.trim() === '') {
        alert('Por favor selecciona un diagnóstico antes de generar el reporte');
        return;
      }

      // Construir parámetros según el modo
      const params = this.getFormParams();
      params.Codigo = codigo;

      // Construir URL con parámetros
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/datos-dashboard?${queryString}`;

      // Usar HTMX para hacer la petición
      htmx.ajax('GET', url, {
        target: '#dashboard-content',
        indicator: '#loading-indicator'
      });

      // Cerrar sidebar en móvil
      this.sidebarOpen = false;
    },

    // Computed property para preview visual del período en el header
    // Esta es lógica UI pura, no afecta el cálculo real de fechas del servidor
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
    // Construye URL con parámetros del formulario y descarga el archivo
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
    // Evita enviar parámetros innecesarios
    getTableSearchParams(searchParam, searchValue) {
      const params = this.getFormParams();
      params[searchParam] = searchValue || '';
      return new URLSearchParams(params).toString();
    }
  }
}
