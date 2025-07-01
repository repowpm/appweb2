export interface Espacio {
  estado: 'LIBRE' | 'OCUPADO' | 'SIN_CONEXION';
  patente?: string;
  horaEntrada?: string;
  horaSalida?: string;
  tiempoOcupado?: number;
  costo?: number;
}

export interface RegistroHistorial {
  id: string;
  espacio: string;
  patente: string;
  horaEntrada: string;
  horaSalida: string;
  tiempoOcupado: number;
  costo: number;
  timestamp: number;
}

export interface Configuracion {
  tarifaHora: number;
}

export interface Metricas {
  ingresosTotales: number;
  totalOcupaciones: number;
  tiempoPromedio: number;
  ingresosPromedio: number;
  ocupacionesPorDia: number;
  espacioMasUtilizado: string;
  patentesMasFrecuentes: Array<{patente: string, cantidad: number}>;
  ingresosPorDia: Array<{fecha: string, ingreso: number}>;
  ocupacionPorHora: Array<{hora: string, cantidad: number}>;
  usoPorEspacio: Array<{espacio: string, cantidad: number}>;
}

export interface TicketData {
  patente: string;
  espacio: string;
  horaEntrada: string;
  horaSalida: string;
  tiempoOcupado: number;
  costo: number;
}

// Tipos para sistema USB
export interface USBDeviceInfo {
  vendorId: number;
  productId: number;
  productName?: string;
  manufacturerName?: string;
  serialNumber?: string;
}

export interface USBConnectionResult {
  exito: boolean;
  mensaje: string;
  dispositivo?: USBDeviceInfo;
}

export interface ImpresoraUSB {
  dispositivo: USBDeviceInfo;
  conectado: boolean;
  ultimaConexion?: string;
  estado: 'disponible' | 'ocupada' | 'error' | 'desconectada';
}

// Actualizar ConfiguracionImpresora para incluir información USB
export interface ConfiguracionImpresora {
  nombre: string;
  tipo: 'termica' | 'matricial' | 'laser' | 'inyeccion';
  anchoPapel: number;
  puerto?: string; // Ahora específico para USB
  resolucion?: number; // DPI de la impresora
  modelo?: string; // Modelo específico de la impresora
  comandos: {
    inicializacion: string;
    alineacion: 'izquierda' | 'centro' | 'derecha';
    fuente: 'normal' | 'grande' | 'pequena';
    negrita: boolean;
  };
  formatoTicket: {
    encabezado?: string;
    piePagina?: string;
    alineacionTitulo?: 'izquierda' | 'centro' | 'derecha';
    tamañoFuente?: 'pequena' | 'normal' | 'grande';
    mostrarSeparadores?: boolean;
    mostrarLogo?: boolean;
    mostrarCodigoQR?: boolean;
    lineasSeparacion?: boolean;
  };
  configuracionCorte?: {
    tipoCorte: 'completo' | 'parcial' | 'desconectado';
    margenCorte: number; // Líneas de margen antes del corte
    cortarAutomaticamente: boolean;
  };
  conexion?: {
    estado: 'conectada' | 'error' | 'desconectada' | 'verificando';
    ultimaVerificacion?: string;
    mensajeError?: string;
    dispositivoUSB?: USBDeviceInfo; // Nueva información USB
  };
} 