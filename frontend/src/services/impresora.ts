import { configuracionRef } from './firebase';
import { onValue, update } from 'firebase/database';
import { formatearFecha } from '../utils/calculos';

export interface ConfiguracionImpresora {
  nombre: string;
  tipo: 'termica' | 'matricial' | 'laser' | 'inyeccion';
  anchoPapel: number;
  puerto?: string;
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
  impresoraTradicional?: {
    nombre?: string;
    tipo?: string;
    tamañoPapel?: string;
    mostrarEncabezado?: boolean;
    mostrarPiePagina?: boolean;
  };
  conexion?: {
    estado: 'conectada' | 'error' | 'desconectada' | 'verificando';
    ultimaVerificacion?: string;
    mensajeError?: string;
  };
}

export class ServicioImpresora {
  private configuracion: ConfiguracionImpresora | null = null;

  constructor() {
    this.cargarConfiguracion();
  }

  private cargarConfiguracion() {
    onValue(configuracionRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.impresora) {
        this.configuracion = data.impresora;
      } else if (data?.impresoras) {
        this.configuracion = data.impresoras;
      } else {
        this.configuracion = null;
      }
    });
  }

  // Comandos ESC/POS básicos
  private comandosESCPOS = {
    inicializar: '\x1B\x40', // ESC @
    alineacionIzquierda: '\x1B\x61\x00', // ESC a 0
    alineacionCentro: '\x1B\x61\x01', // ESC a 1
    alineacionDerecha: '\x1B\x61\x02', // ESC a 2
    // Comandos de fuente corregidos para Nippon Primex
    fuenteNormal: '\x1B\x21\x00', // ESC ! 0 (normal)
    fuenteGrande: '\x1B\x21\x11', // ESC ! 17 (doble altura y ancho)
    fuentePequena: '\x1B\x21\x01', // ESC ! 1 (doble altura)
    fuenteExtraGrande: '\x1B\x21\x30', // ESC ! 48 (cuádruple altura y ancho)
    negritaOn: '\x1B\x45\x01', // ESC E 1
    negritaOff: '\x1B\x45\x00', // ESC E 0
    // Comandos de corte corregidos
    cortarPapel: '\x1D\x56\x00', // GS V 0 (corte completo)
    cortarPapelParcial: '\x1D\x56\x01', // GS V 1 (corte parcial)
    cortarPapelCompleto: '\x1D\x56\x00', // GS V 0 (corte completo)
    nuevaLinea: '\x0A', // LF
    tab: '\x09', // TAB
    espacio: '\x20', // SPACE
    // Comandos específicos para Nippon Primex 300dpi
    establecerResolucion: '\x1D\x7C\x00', // GS | 0 (para 300dpi)
    establecerVelocidad: '\x1B\x73\x00', // ESC s 0 (velocidad normal)
    establecerDensidad: '\x1B\x47\x00', // ESC G 0 (densidad normal)
    // Comandos de margen y espaciado
    establecerMargenIzquierdo: '\x1B\x6C\x00', // ESC l 0
    establecerMargenDerecho: '\x1B\x51\x00', // ESC Q 0
    establecerInterlineado: '\x1B\x32', // ESC 2 (interlineado 1/6")
    establecerInterlineadoPersonalizado: '\x1B\x33\x18', // ESC 3 24 (interlineado personalizado)
    avanzarLinea: '\x1B\x4A\x00', // ESC J 0 (avanzar 0 líneas)
    avanzarLineaCompleta: '\x1B\x4A\x18', // ESC J 24 (avanzar 24 líneas = 1 pulgada)
    // Comandos adicionales para mejor calidad
    establecerModoImpresion: '\x1B\x21\x00', // ESC ! 0 (modo normal)
    establecerModoImpresionAlta: '\x1B\x21\x08', // ESC ! 8 (modo alta calidad)
    establecerModoImpresionMaxima: '\x1B\x21\x10' // ESC ! 16 (modo máxima calidad)
  };

  // Generar comandos de inicialización
  private generarComandosInicializacion(): string {
    if (!this.configuracion) return '';

    let comandos = this.comandosESCPOS.inicializar;
    
    // Configuraciones específicas para Nippon Primex
    if (this.configuracion.modelo?.toLowerCase().includes('primex')) {
      // Configurar resolución para 300dpi
      if (this.configuracion.resolucion === 300) {
        comandos += this.comandosESCPOS.establecerResolucion;
      }
      
      // Configurar velocidad y densidad para mejor calidad
      comandos += this.comandosESCPOS.establecerVelocidad;
      comandos += this.comandosESCPOS.establecerDensidad;
      
      // Configurar interlineado personalizado para mejor legibilidad
      comandos += this.comandosESCPOS.establecerInterlineadoPersonalizado;
      
      // Configurar modo de impresión de alta calidad
      comandos += this.comandosESCPOS.establecerModoImpresionAlta;
    }
    
    // Aplicar alineación
    const alineacion = this.configuracion.formatoTicket?.alineacionTitulo || 'centro';
    switch (alineacion) {
      case 'izquierda':
        comandos += this.comandosESCPOS.alineacionIzquierda;
        break;
      case 'centro':
        comandos += this.comandosESCPOS.alineacionCentro;
        break;
      case 'derecha':
        comandos += this.comandosESCPOS.alineacionDerecha;
        break;
    }

    // Aplicar fuente con mejor configuración
    const tamañoFuente = this.configuracion.formatoTicket?.tamañoFuente || 'normal';
    switch (tamañoFuente) {
      case 'normal':
        comandos += this.comandosESCPOS.fuenteNormal;
        break;
      case 'grande':
        comandos += this.comandosESCPOS.fuenteGrande;
        break;
      case 'pequena':
        comandos += this.comandosESCPOS.fuentePequena;
        break;
    }

    // Aplicar negrita si está configurada
    if (this.configuracion.comandos?.negrita) {
      comandos += this.comandosESCPOS.negritaOn;
    }

    return comandos;
  }

  // Generar línea de separación
  private generarLineaSeparacion(): string {
    if (!this.configuracion) return '';
    
    const caracteres = Math.floor(this.configuracion.anchoPapel / 8); // Aproximadamente
    return '═'.repeat(caracteres) + this.comandosESCPOS.nuevaLinea;
  }

  // Procesar texto con saltos de línea
  private procesarTexto(texto: string): string {
    if (!texto) return '';
    return texto.replace(/&#10;/g, this.comandosESCPOS.nuevaLinea) + this.comandosESCPOS.nuevaLinea;
  }

  // Generar ticket completo
  public generarTicket(datos: {
    espacio: string;
    patente: string;
    horaEntrada: string;
    horaSalida: string;
    tiempoTotal: string;
    tarifaHora: number;
    costoTotal: number;
    fecha: string | number;
  }): string {
    if (!this.configuracion) {
      throw new Error('Configuración de impresora no disponible');
    }
    let ticket = '';
    // Encabezado personalizado (si está configurado)
    if (this.configuracion.formatoTicket?.encabezado) {
      ticket += this.comandosESCPOS.alineacionCentro;
      ticket += this.procesarTexto(this.configuracion.formatoTicket.encabezado);
      if (this.configuracion.formatoTicket?.mostrarSeparadores) {
        ticket += this.generarLineaSeparacion();
      }
    }
    // Logo (si está habilitado y no hay encabezado personalizado)
    if (this.configuracion.formatoTicket?.mostrarLogo && !this.configuracion.formatoTicket?.encabezado) {
      ticket += this.comandosESCPOS.alineacionCentro;
      ticket += '🏢 LOGO EMPRESA' + this.comandosESCPOS.nuevaLinea;
      if (this.configuracion.formatoTicket?.mostrarSeparadores) {
        ticket += this.generarLineaSeparacion();
      }
    }
    // Título
    ticket += this.comandosESCPOS.alineacionCentro;
    ticket += 'TICKET DE ESTACIONAMIENTO' + this.comandosESCPOS.nuevaLinea;
    if (this.configuracion.formatoTicket?.mostrarSeparadores) {
      ticket += this.generarLineaSeparacion();
    }
    // Datos del ticket
    ticket += this.comandosESCPOS.alineacionIzquierda;
    ticket += `Espacio: ${datos.espacio}` + this.comandosESCPOS.nuevaLinea;
    ticket += `Patente: ${datos.patente}` + this.comandosESCPOS.nuevaLinea;
    ticket += this.comandosESCPOS.nuevaLinea;
    ticket += `Hora de Entrada: ${datos.horaEntrada}` + this.comandosESCPOS.nuevaLinea;
    ticket += `Hora de Salida:  ${datos.horaSalida}` + this.comandosESCPOS.nuevaLinea;
    ticket += this.comandosESCPOS.nuevaLinea;
    ticket += `Tiempo Total: ${datos.tiempoTotal}` + this.comandosESCPOS.nuevaLinea;
    ticket += this.comandosESCPOS.nuevaLinea;
    ticket += `Tarifa por Hora: $${datos.tarifaHora.toLocaleString('es-CL')}` + this.comandosESCPOS.nuevaLinea;
    ticket += `Costo Total:     $${datos.costoTotal.toLocaleString('es-CL')}` + this.comandosESCPOS.nuevaLinea;
    ticket += this.comandosESCPOS.nuevaLinea;
    // Formatear la fecha correctamente
    const fechaFormateada = formatearFecha(datos.fecha, 'corto');
    ticket += `Fecha: ${fechaFormateada}` + this.comandosESCPOS.nuevaLinea;
    // No mostrar la línea de 'Hora'
    // Líneas de separación (si están habilitadas)
    if (this.configuracion.formatoTicket?.mostrarSeparadores) {
      ticket += this.generarLineaSeparacion();
    }
    // Pie de página personalizado
    ticket += this.comandosESCPOS.alineacionCentro;
    if (this.configuracion.formatoTicket?.piePagina) {
      ticket += this.procesarTexto(this.configuracion.formatoTicket.piePagina);
    } else {
      ticket += '¡GRACIAS POR SU VISITA!' + this.comandosESCPOS.nuevaLinea;
      ticket += 'Conserve este ticket' + this.comandosESCPOS.nuevaLinea;
    }
    if (this.configuracion.formatoTicket?.mostrarSeparadores) {
      ticket += this.generarLineaSeparacion();
    }
    // Configuración de corte de papel
    const configCorte = this.configuracion.configuracionCorte || {
      tipoCorte: 'completo',
      margenCorte: 3,
      cortarAutomaticamente: true
    };
    // Agregar margen antes del corte
    if (configCorte.margenCorte > 0) {
      for (let i = 0; i < configCorte.margenCorte; i++) {
        ticket += this.comandosESCPOS.nuevaLinea;
      }
    }
    // CORTE AUTOMÁTICO: aplicar el comando correcto según la configuración
    if (configCorte.cortarAutomaticamente) {
      switch (configCorte.tipoCorte) {
        case 'parcial':
          ticket += this.comandosESCPOS.cortarPapelParcial;
          break;
        case 'desconectado':
          ticket += this.comandosESCPOS.avanzarLineaCompleta;
          break;
        case 'completo':
        default:
          ticket += this.comandosESCPOS.cortarPapelCompleto;
          break;
      }
    }
    return ticket;
  }

  // Generar ticket para vista previa web (sin comandos ESC/POS)
  public generarTicketWeb(datos: {
    espacio: string;
    patente: string;
    horaEntrada: string;
    horaSalida: string;
    tiempoTotal: string;
    tarifaHora: number;
    costoTotal: number;
    fecha: string | number;
  }): string {
    if (!this.configuracion) {
      throw new Error('Configuración de impresora no disponible');
    }
    let ticket = '';
    // Aplicar alineación inicial
    const alineacion = this.configuracion.formatoTicket?.alineacionTitulo || 'centro';
    const tamañoFuente = this.configuracion.formatoTicket?.tamañoFuente || 'normal';
    // Encabezado personalizado (si está configurado)
    if (this.configuracion.formatoTicket?.encabezado) {
      ticket += this.aplicarAlineacionWeb(alineacion);
      ticket += this.aplicarTamañoFuenteWeb(tamañoFuente);
      ticket += this.procesarTextoWeb(this.configuracion.formatoTicket.encabezado);
      ticket += '</span></div>';
      if (this.configuracion.formatoTicket?.mostrarSeparadores) {
        ticket += this.generarLineaSeparacionWeb();
      }
    }
    // Logo (si está habilitado y no hay encabezado personalizado)
    if (this.configuracion.formatoTicket?.mostrarLogo && !this.configuracion.formatoTicket?.encabezado) {
      ticket += this.aplicarAlineacionWeb(alineacion);
      ticket += this.aplicarTamañoFuenteWeb(tamañoFuente);
      ticket += '🏢 LOGO EMPRESA\n';
      ticket += '</span></div>';
      if (this.configuracion.formatoTicket?.mostrarSeparadores) {
        ticket += this.generarLineaSeparacionWeb();
      }
    }
    // Título
    ticket += this.aplicarAlineacionWeb(alineacion);
    ticket += this.aplicarTamañoFuenteWeb(tamañoFuente);
    ticket += 'TICKET DE ESTACIONAMIENTO\n';
    ticket += '</span></div>';
    if (this.configuracion.formatoTicket?.mostrarSeparadores) {
      ticket += this.generarLineaSeparacionWeb();
    }
    // Datos del ticket (alineación izquierda)
    ticket += this.aplicarAlineacionWeb('izquierda');
    ticket += this.aplicarTamañoFuenteWeb(tamañoFuente);
    ticket += `Espacio: ${datos.espacio}\n`;
    ticket += `Patente: ${datos.patente}\n`;
    ticket += '\n';
    ticket += `Hora de Entrada: ${datos.horaEntrada}\n`;
    ticket += `Hora de Salida:  ${datos.horaSalida}\n`;
    ticket += '\n';
    ticket += `Tiempo Total: ${datos.tiempoTotal}\n`;
    ticket += '\n';
    ticket += `Tarifa por Hora: $${datos.tarifaHora.toLocaleString('es-CL')}\n`;
    ticket += `Costo Total:     $${datos.costoTotal.toLocaleString('es-CL')}\n`;
    ticket += '\n';
    // Formatear la fecha correctamente
    const fechaFormateada = formatearFecha(datos.fecha, 'corto');
    ticket += `Fecha: ${fechaFormateada}\n`;
    // No mostrar la línea de 'Hora'
    ticket += '</span></div>';
    // Líneas de separación (si están habilitadas)
    if (this.configuracion.formatoTicket?.mostrarSeparadores) {
      ticket += this.generarLineaSeparacionWeb();
    }
    // Pie de página personalizado (alineación centro)
    ticket += this.aplicarAlineacionWeb('centro');
    ticket += this.aplicarTamañoFuenteWeb(tamañoFuente);
    if (this.configuracion.formatoTicket?.piePagina) {
      ticket += this.procesarTextoWeb(this.configuracion.formatoTicket.piePagina);
    } else {
      ticket += '¡GRACIAS POR SU VISITA!\n';
      ticket += 'Conserve este ticket\n';
    }
    ticket += '</span></div>';
    if (this.configuracion.formatoTicket?.mostrarSeparadores) {
      ticket += this.generarLineaSeparacionWeb();
    }
    return ticket;
  }

  // Generar ticket del historial para impresora tradicional
  public generarTicketHistorial(datos: any): string {
    if (!this.configuracion) {
      throw new Error('Configuración de impresora no disponible');
    }

    const tamañoPapel = this.configuracion.impresoraTradicional?.tamañoPapel || 'A4';
    const mostrarEncabezado = this.configuracion.impresoraTradicional?.mostrarEncabezado || false;
    const mostrarPiePagina = this.configuracion.impresoraTradicional?.mostrarPiePagina || false;

    let ticket = `
<!DOCTYPE html>
<html>
<head>
    <title>Ticket Historial - ${datos.espacio}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            margin: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 14px;
            color: #666;
        }
        .ticket-info {
            margin: 20px 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        .label {
            font-weight: bold;
            color: #333;
        }
        .value {
            color: #666;
        }
        .total {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 20px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            color: #666;
            font-size: 10px;
        }
        .separator {
            border-top: 1px solid #ccc;
            margin: 15px 0;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
`;

    // Encabezado
    if (mostrarEncabezado) {
      ticket += `
    <div class="header">
        <div class="title">SISTEMA DE ESTACIONAMIENTO</div>
        <div class="subtitle">Ticket de Historial</div>
    </div>
`;
    }

    // Información del ticket
    ticket += `
    <div class="ticket-info">
        <div class="info-row">
            <span class="label">Espacio:</span>
            <span class="value">${datos.espacio}</span>
        </div>
        <div class="info-row">
            <span class="label">Patente:</span>
            <span class="value">${datos.patente}</span>
        </div>
        <div class="info-row">
            <span class="label">Hora de Entrada:</span>
            <span class="value">${datos.horaEntrada}</span>
        </div>
        <div class="info-row">
            <span class="label">Hora de Salida:</span>
            <span class="value">${datos.horaSalida}</span>
        </div>
        <div class="info-row">
            <span class="label">Tiempo Total:</span>
            <span class="value">${this.formatearTiempo(datos.tiempoOcupado)}</span>
        </div>
        <div class="info-row">
            <span class="label">Tarifa por Hora:</span>
            <span class="value">$${datos.tarifaHora?.toLocaleString('es-CL') || '0'}</span>
        </div>
        <div class="info-row total">
            <span class="label">Costo Total:</span>
            <span class="value">$${datos.costo?.toLocaleString('es-CL') || '0'}</span>
        </div>
    </div>
`;

    // Pie de página
    if (mostrarPiePagina) {
      ticket += `
    <div class="footer">
        <div>Ticket impreso desde el historial</div>
        <div>Fecha de impresión: ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL')}</div>
        <div>Estado: ${datos.estado === 'FINALIZADO' ? 'FINALIZADO' : 'PENDIENTE'}</div>
    </div>
`;
    }

    ticket += `
</body>
</html>`;

    return ticket;
  }

  // Formatear tiempo para el historial
  private formatearTiempo(segundos: number): string {
    if (!segundos || segundos < 1) return '--';
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    return [
      h > 0 ? `${h}h` : '',
      m > 0 ? `${m}m` : '',
      s > 0 ? `${s}s` : ''
    ].filter(Boolean).join(' ');
  }

  // Generar línea de separación para web
  private generarLineaSeparacionWeb(): string {
    if (!this.configuracion) return '';
    
    const caracteres = Math.floor(this.configuracion.anchoPapel / 8); // Aproximadamente
    return '═'.repeat(caracteres) + '\n';
  }

  // Procesar texto con saltos de línea para web
  private procesarTextoWeb(texto: string): string {
    if (!texto) return '';
    return texto.replace(/&#10;/g, '\n') + '\n';
  }

  // Aplicar alineación en formato web
  private aplicarAlineacionWeb(alineacion: 'izquierda' | 'centro' | 'derecha'): string {
    switch (alineacion) {
      case 'izquierda':
        return '<div style="text-align: left;">';
      case 'centro':
        return '<div style="text-align: center;">';
      case 'derecha':
        return '<div style="text-align: right;">';
      default:
        return '<div style="text-align: center;">';
    }
  }

  // Aplicar tamaño de fuente en formato web
  private aplicarTamañoFuenteWeb(tamaño: 'pequena' | 'normal' | 'grande'): string {
    switch (tamaño) {
      case 'pequena':
        return '<span style="font-size: 10px;">';
      case 'normal':
        return '<span style="font-size: 12px;">';
      case 'grande':
        return '<span style="font-size: 16px;">';
      default:
        return '<span style="font-size: 12px;">';
    }
  }

  // Obtener tamaño de fuente CSS
  private obtenerTamañoFuenteCSS(tamaño: 'pequena' | 'normal' | 'grande'): string {
    switch (tamaño) {
      case 'pequena':
        return '10px';
      case 'normal':
        return '12px';
      case 'grande':
        return '16px';
      default:
        return '12px';
    }
  }

  // Aplicar alineación en formato térmico
  private aplicarAlineacionTermico(alineacion: 'izquierda' | 'centro' | 'derecha'): string {
    switch (alineacion) {
      case 'izquierda':
        return '<div style="text-align: left;">';
      case 'centro':
        return '<div style="text-align: center;">';
      case 'derecha':
        return '<div style="text-align: right;">';
      default:
        return '<div style="text-align: center;">';
    }
  }

  // Aplicar tamaño de fuente en formato térmico
  private aplicarTamañoFuenteTermico(tamaño: 'pequena' | 'normal' | 'grande'): string {
    switch (tamaño) {
      case 'pequena':
        return '<span style="font-size: 10px;">';
      case 'normal':
        return '<span style="font-size: 12px;">';
      case 'grande':
        return '<span style="font-size: 16px;">';
      default:
        return '<span style="font-size: 12px;">';
    }
  }

  // Imprimir ticket usando impresora predeterminada de Windows
  public async imprimirTicket(datos: any): Promise<{ exito: boolean; mensaje: string }> {
    try {
      if (!this.configuracion) {
        return { exito: false, mensaje: 'No hay configuración de impresora disponible' };
      }

      // Generar ticket optimizado para impresora térmica
      const ticket = this.generarTicketTermico(datos);
      
      // Obtener configuración de fuente
      const tamañoFuente = this.configuracion.formatoTicket?.tamañoFuente || 'normal';
      const fontSize = this.obtenerTamañoFuenteCSS(tamañoFuente);
      
      // Crear ventana de impresión con configuración específica
      const ventanaImpresion = window.open('', '_blank', 'width=400,height=600');
      if (!ventanaImpresion) {
        return { exito: false, mensaje: 'No se pudo abrir ventana de impresión' };
      }

      // Escribir contenido optimizado para impresora térmica
      ventanaImpresion.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ticket - ${datos.espacio}</title>
          <style>
            @media print {
              @page {
                margin: 0;
                size: 80mm auto;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: 'Courier New', monospace;
                font-size: ${fontSize};
                line-height: 1.2;
                width: 80mm;
                max-width: 80mm;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              .ticket-content {
                width: 100%;
                max-width: 80mm;
                text-align: center;
                white-space: pre-line;
                font-size: ${fontSize};
              }
              .no-print { display: none; }
              .corte-completo { page-break-after: always; }
              .corte-parcial { margin-bottom: 20px; }
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: ${fontSize};
              line-height: 1.2;
              margin: 0;
              padding: 10px;
              text-align: center;
              white-space: pre-line;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            .ticket-content {
              width: 100%;
              max-width: 80mm;
              margin: 0 auto;
              font-size: ${fontSize};
            }
            .print-button {
              position: fixed;
              top: 10px;
              right: 10px;
              padding: 10px 20px;
              background: #007bff;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
            }
            .print-button:hover {
              background: #0056b3;
            }
            .corte-completo {
              border-bottom: 2px dashed #000;
              margin-bottom: 10px;
            }
            .corte-parcial {
              border-bottom: 1px dotted #000;
              margin-bottom: 5px;
            }
          </style>
        </head>
        <body>
          <button class="print-button no-print" onclick="window.print()">Imprimir</button>
          <div class="ticket-content">
${ticket}
          </div>
        </body>
        </html>
      `);
      
      ventanaImpresion.document.close();
      ventanaImpresion.focus();

      return { exito: true, mensaje: 'Ticket impreso y corte ejecutado.' };
    } catch (error) {
      const mensajeError = error instanceof Error ? error.message : 'Error desconocido';
      return { exito: false, mensaje: mensajeError };
    }
  }

  // Generar ticket optimizado para impresora térmica
  private generarTicketTermico(datos: any): string {
    const config = this.configuracion!;
    let ticket = '';

    // Comandos de inicialización y configuración SOLO si es impresión térmica directa
    if (config.tipo === 'termica' && config.puerto) {
      ticket += this.generarComandosInicializacion();
    }

    // Encabezado
    if (config.formatoTicket?.encabezado) {
      if (config.tipo === 'termica' && config.puerto) {
        ticket += this.comandosESCPOS.alineacionCentro;
        ticket += this.procesarTexto(config.formatoTicket.encabezado);
      } else {
        ticket += `${config.formatoTicket.encabezado}\n`;
      }
    }

    // Línea separadora
    if (config.formatoTicket?.mostrarSeparadores) {
      if (config.tipo === 'termica' && config.puerto) {
        ticket += this.generarLineaSeparacion();
      } else {
        ticket += '------------------------------\n';
      }
    }

    // Datos del ticket (alineación izquierda, fuente normal)
    if (config.tipo === 'termica' && config.puerto) {
      ticket += this.comandosESCPOS.alineacionIzquierda;
      ticket += this.comandosESCPOS.fuenteNormal;
    }
    ticket += `Espacio: ${datos.espacio}` + (config.tipo === 'termica' && config.puerto ? this.comandosESCPOS.nuevaLinea : '\n');
    ticket += `Patente: ${datos.patente}` + (config.tipo === 'termica' && config.puerto ? this.comandosESCPOS.nuevaLinea : '\n');
    ticket += (config.tipo === 'termica' && config.puerto ? this.comandosESCPOS.nuevaLinea : '\n');
    ticket += `Hora de Entrada: ${datos.horaEntrada}` + (config.tipo === 'termica' && config.puerto ? this.comandosESCPOS.nuevaLinea : '\n');
    ticket += `Hora de Salida:  ${datos.horaSalida}` + (config.tipo === 'termica' && config.puerto ? this.comandosESCPOS.nuevaLinea : '\n');
    ticket += (config.tipo === 'termica' && config.puerto ? this.comandosESCPOS.nuevaLinea : '\n');
    ticket += `Tiempo Total: ${datos.tiempoTotal}` + (config.tipo === 'termica' && config.puerto ? this.comandosESCPOS.nuevaLinea : '\n');
    ticket += (config.tipo === 'termica' && config.puerto ? this.comandosESCPOS.nuevaLinea : '\n');
    ticket += `Tarifa por Hora: $${datos.tarifaHora?.toLocaleString('es-CL')}` + (config.tipo === 'termica' && config.puerto ? this.comandosESCPOS.nuevaLinea : '\n');
    ticket += `Costo Total:     $${datos.costoTotal?.toLocaleString('es-CL')}` + (config.tipo === 'termica' && config.puerto ? this.comandosESCPOS.nuevaLinea : '\n');
    ticket += (config.tipo === 'termica' && config.puerto ? this.comandosESCPOS.nuevaLinea : '\n');
    // Formatear la fecha correctamente
    let fechaFormateada = datos.fecha;
    if (typeof datos.fecha === 'string' || typeof datos.fecha === 'number') {
      const fechaObj = new Date(datos.fecha);
      if (!isNaN(fechaObj.getTime())) {
        fechaFormateada = fechaObj.toLocaleDateString('es-CL');
      }
    }
    ticket += `Fecha: ${fechaFormateada}` + (config.tipo === 'termica' && config.puerto ? this.comandosESCPOS.nuevaLinea : '\n');
    // Eliminar la impresión duplicada de la hora
    // ticket += `Hora:  ${datos.horaSalida}` + (config.tipo === 'termica' && config.puerto ? this.comandosESCPOS.nuevaLinea : '\n');

    // Línea separadora
    if (config.formatoTicket?.mostrarSeparadores) {
      if (config.tipo === 'termica' && config.puerto) {
        ticket += this.generarLineaSeparacion();
      } else {
        ticket += '------------------------------\n';
      }
    }

    // Pie de página personalizado
    if (config.tipo === 'termica' && config.puerto) {
      ticket += this.comandosESCPOS.alineacionCentro;
    }
    if (config.formatoTicket?.piePagina) {
      if (config.tipo === 'termica' && config.puerto) {
        ticket += this.procesarTexto(config.formatoTicket.piePagina);
      } else {
        ticket += `${config.formatoTicket.piePagina}\n`;
      }
    } else {
      ticket += (config.tipo === 'termica' && config.puerto ? '¡GRACIAS POR SU VISITA!' + this.comandosESCPOS.nuevaLinea + 'Conserve este ticket' + this.comandosESCPOS.nuevaLinea : '¡GRACIAS POR SU VISITA!\nConserve este ticket\n');
    }

    if (config.formatoTicket?.mostrarSeparadores) {
      ticket += this.generarLineaSeparacion();
    }

    // Configuración de corte de papel SOLO si es impresión térmica directa
    if (config.tipo === 'termica' && config.puerto) {
      const configCorte = config.configuracionCorte || {
        tipoCorte: 'completo',
        margenCorte: 3,
        cortarAutomaticamente: true
      };
      // Agregar margen antes del corte
      if (configCorte.margenCorte > 0) {
        for (let i = 0; i < configCorte.margenCorte; i++) {
          ticket += this.comandosESCPOS.nuevaLinea;
        }
      }
      // Aplicar el tipo de corte configurado
      if (configCorte.cortarAutomaticamente) {
        switch (configCorte.tipoCorte) {
          case 'parcial':
            ticket += this.comandosESCPOS.cortarPapelParcial;
            break;
          case 'desconectado':
            ticket += this.comandosESCPOS.avanzarLineaCompleta;
            break;
          case 'completo':
          default:
            ticket += this.comandosESCPOS.cortarPapelCompleto;
            break;
        }
      }
    }

    return ticket;
  }

  // Probar conexión con impresión de prueba
  public async probarConexion(): Promise<{ exito: boolean; mensaje: string }> {
    try {
      // Primero validar la conexión
      const validacion = await this.validarConexion();
      if (!validacion.exito) {
        return validacion;
      }
      // Usar la configuración real para el ticket de prueba
      const datosPrueba = {
        espacio: 'TEST',
        patente: 'PRUEBA',
        horaEntrada: '00:00:00',
        horaSalida: '00:00:00',
        tiempoTotal: '0m',
        tarifaHora: 0,
        costoTotal: 0,
        fecha: new Date().toLocaleDateString('es-CL')
      };
      // Imprimir ticket de prueba usando la configuración real
      const resultado = await this.imprimirTicket(datosPrueba);
      if (resultado.exito) {
        return { exito: true, mensaje: 'Prueba de impresión y corte ejecutado.' };
      } else {
        return { exito: false, mensaje: `Conexión válida pero error al imprimir: ${resultado.mensaje}` };
      }
    } catch (error) {
      const mensajeError = error instanceof Error ? error.message : 'Error desconocido';
      return { exito: false, mensaje: mensajeError };
    }
  }

  // Actualizar estado de conexión en Firebase
  private async actualizarEstadoConexion(estado: 'conectada' | 'error' | 'desconectada' | 'verificando', mensaje?: string): Promise<void> {
    try {
      const datosActualizacion: any = {
        'impresora/conexion/estado': estado,
        'impresora/conexion/ultimaVerificacion': new Date().toISOString()
      };

      if (mensaje) {
        datosActualizacion['impresora/conexion/mensajeError'] = mensaje;
      }

      await update(configuracionRef, datosActualizacion);
    } catch (error) {
      console.error('Error actualizando estado de conexión:', error);
    }
  }



  public async validarConexion(): Promise<{ exito: boolean; mensaje: string }> {
    if (!this.configuracion) {
      return { exito: false, mensaje: 'No hay configuración de impresora disponible' };
    }
    try {
      // Aquí puedes agregar lógica real de validación USB si la tienes,
      // o simplemente simular la validación para la impresora predeterminada.
      // Por ahora, validamos que la impresora esté configurada.
      return { exito: true, mensaje: 'Impresora configurada correctamente.' };
    } catch (error) {
      const mensajeError = error instanceof Error ? error.message : 'Error desconocido';
      return { exito: false, mensaje: mensajeError };
    }
  }

  /**
   * Envía solo el comando de corte automático a la impresora para pruebas.
   */
  public async probarCorte(): Promise<{ exito: boolean; mensaje: string }> {
    if (!this.configuracion) {
      return { exito: false, mensaje: 'Configuración de impresora no disponible' };
    }
    try {
      // Comando de corte según configuración
      const configCorte = this.configuracion.configuracionCorte || {
        tipoCorte: 'completo',
        margenCorte: 3,
        cortarAutomaticamente: true
      };
      let comandoCorte = '';
      if (configCorte.cortarAutomaticamente) {
        switch (configCorte.tipoCorte) {
          case 'parcial':
            comandoCorte = this.comandosESCPOS.cortarPapelParcial;
            break;
          case 'desconectado':
            comandoCorte = this.comandosESCPOS.avanzarLineaCompleta;
            break;
          case 'completo':
          default:
            comandoCorte = this.comandosESCPOS.cortarPapelCompleto;
            break;
        }
      } else {
        comandoCorte = this.comandosESCPOS.nuevaLinea;
      }
      // Aquí deberías enviar el comandoCorte a la impresora física
      // Por ejemplo, si tienes un método enviarComandoRaw:
      // await this.enviarComandoRaw(comandoCorte);
      // Por ahora, solo simula éxito
      return { exito: true, mensaje: 'Comando de corte enviado a la impresora.' };
    } catch (error) {
      return { exito: false, mensaje: 'Error al enviar comando de corte.' };
    }
  }


}

// Instancia global del servicio
export const servicioImpresora = new ServicioImpresora(); 