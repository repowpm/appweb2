import React, { useEffect, useState } from 'react';
import { onValue, ref, update } from 'firebase/database';
import { historialRef } from '../../services/firebase';
import { servicioImpresora } from '../../services/impresora';
import { Printer, CheckCircle, AlertCircle, Search, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { useToast } from '../Layout/ToastContext';
import { database } from '../../services/firebase';
import { formatearFecha } from '../../utils/calculos';
import type { Configuracion } from '../../types';

interface RegistroHistorial {
  id: string;
  espacio: string;
  patente: string;
  horaEntrada: string;
  horaSalida: string;
  tiempoOcupado: number;
  costo: number;
  fecha: string;
  timestamp: number;
  estado: 'PENDIENTE' | 'FINALIZADO';
}

const PAGE_SIZE = 20;

function formatearTiempo(segundos: number) {
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

// Función para calcular la fecha a partir de otros datos
function calcularFecha(registro: any): string {
  try {
    // Si ya tiene fecha, usarla
    if (registro.fecha) {
      const fecha = new Date(registro.fecha);
      if (!isNaN(fecha.getTime())) {
        return fecha.toLocaleDateString('es-CL');
      }
    }
    
    // Si tiene timestampSalida, usarlo
    if (registro.timestampSalida) {
      const fecha = new Date(registro.timestampSalida);
      if (!isNaN(fecha.getTime())) {
        return fecha.toLocaleDateString('es-CL');
      }
    }
    
    // Si tiene horaSalida, intentar calcular la fecha
    if (registro.horaSalida) {
      const ahora = new Date();
      const horaSalida = registro.horaSalida;
      
      // Intentar parsear la hora de salida
      const [horas, minutos, segundos] = horaSalida.split(':').map(Number);
      if (!isNaN(horas) && !isNaN(minutos)) {
        const horaSalidaDate = new Date();
        horaSalidaDate.setHours(horas, minutos, segundos || 0);
        
        const horaActual = new Date();
        
        // Si la hora de salida es mayor a la hora actual, asumir que fue ayer
        if (horaSalidaDate.getHours() > horaActual.getHours() || 
            (horaSalidaDate.getHours() === horaActual.getHours() && horaSalidaDate.getMinutes() > horaActual.getMinutes())) {
          const ayer = new Date(ahora);
          ayer.setDate(ahora.getDate() - 1);
          return ayer.toLocaleDateString('es-CL');
        }
        
        return ahora.toLocaleDateString('es-CL');
      }
    }
    
    // Si tiene ID, intentar extraer fecha del ID (si tiene formato de timestamp)
    if (registro.id && registro.id.length > 10) {
      const posibleTimestamp = parseInt(registro.id);
      if (!isNaN(posibleTimestamp) && posibleTimestamp > 1000000000000) { // Timestamp válido
        const fecha = new Date(posibleTimestamp);
        if (!isNaN(fecha.getTime())) {
          return fecha.toLocaleDateString('es-CL');
        }
      }
    }
    
    // Si no tiene nada, usar la fecha actual
    return new Date().toLocaleDateString('es-CL');
  } catch (error) {
    // En caso de error, usar fecha actual
    return new Date().toLocaleDateString('es-CL');
  }
}

const actualizarEstadoHistorial = async (idRegistro: string, nuevoEstado: 'PENDIENTE' | 'FINALIZADO') => {
  const registroRef = ref(database, `historial/${idRegistro}`);
  await update(registroRef, { estado: nuevoEstado });
};

const Historial: React.FC = () => {
  const { showToast } = useToast();
  const [historial, setHistorial] = useState<RegistroHistorial[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [configuracion, setConfiguracion] = useState<Configuracion>({
    tarifaHora: 1000,
    impresoras: { formatoTicket: {} },
    impresora: { formatoTicket: {} },
    formatoTicket: {}
  });
  const [modalImpresionAbierto, setModalImpresionAbierto] = useState(false);

  useEffect(() => {
    // Cargar configuración
    const configuracionRef = ref(database, 'configuracion');
    const unsubscribeConfig = onValue(configuracionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Guarda toda la configuración, no solo la tarifa
        setConfiguracion(data);
      }
    });

    // Cargar historial
    const historialRef = ref(database, 'historial');
    const unsubscribeHistorial = onValue(historialRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const historialArray = Object.entries(data).map(([id, registro]: [string, any]) => ({
          id,
          ...registro,
          estado: (registro.estado || 'PENDIENTE').toUpperCase() === 'COMPLETADO' ? 'FINALIZADO' : (registro.estado || 'PENDIENTE').toUpperCase(), // Normalizar estados
        })).sort((a, b) => {
          // Función para obtener timestamp de ordenamiento
          const getTimestamp = (registro: any): number => {
            // 1. Usar timestamp si existe (más confiable)
            if (registro.timestamp && typeof registro.timestamp === 'number') {
              return registro.timestamp;
            }
            
            // 2. Intentar usar fecha si existe y es válida
            if (registro.fecha) {
              const fecha = new Date(registro.fecha);
              if (!isNaN(fecha.getTime())) {
                return fecha.getTime();
              }
            }
            
            // 3. Intentar usar timestampSalida si existe
            if (registro.timestampSalida) {
              const fecha = new Date(registro.timestampSalida);
              if (!isNaN(fecha.getTime())) {
                return fecha.getTime();
              }
            }
            
            // 4. Intentar extraer timestamp del ID si es un timestamp válido
            if (registro.id && registro.id.length > 10) {
              const posibleTimestamp = parseInt(registro.id);
              if (!isNaN(posibleTimestamp) && posibleTimestamp > 1000000000000) {
                return posibleTimestamp;
              }
            }
            
            // 5. Si no hay nada válido, usar 0 (aparecerá al final)
            return 0;
          };
          
          const timestampA = getTimestamp(a);
          const timestampB = getTimestamp(b);
          
          // Ordenar de más reciente a más antiguo
          return timestampB - timestampA;
        });
        setHistorial(historialArray);
      } else {
        setHistorial([]);
      }
    });

    return () => {
      unsubscribeConfig();
      unsubscribeHistorial();
    };
  }, []);

  // Filtrar por patente
  const historialFiltrado = historial.filter(reg =>
    reg.patente && reg.patente.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Paginación con números de página
  const totalPaginas = Math.ceil(historialFiltrado.length / PAGE_SIZE);
  const registrosPagina = historialFiltrado.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);
  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1);

  // Imprimir ticket y actualizar estado SOLO después de imprimir en ventana emergente
  const handleImprimir = async (registro: RegistroHistorial) => {
    try {
      // Formatear tiempo total para el ticket
      const formatearTiempoTicket = (segundos: number): string => {
        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        const segs = segundos % 60;
        if (horas > 0) {
          return `${horas}h ${minutos}m ${segs}s`;
        } else if (minutos > 0) {
          return `${minutos}m ${segs}s`;
        } else {
          return `${segs}s`;
        }
      };

      // Generar datos del ticket en formato térmico
      const datosTicket = {
        espacio: registro.espacio,
        patente: registro.patente,
        horaEntrada: registro.horaEntrada,
        horaSalida: registro.horaSalida,
        tiempoTotal: formatearTiempoTicket(registro.tiempoOcupado),
        tarifaHora: configuracion.tarifaHora,
        costoTotal: registro.costo,
        fecha: formatearFecha(Date.now(), 'corto') // SIEMPRE fecha/hora del sistema
      };

      // Recuperar encabezado y pie de página desde la configuración (soportando ambas estructuras)
      const formatoTicket = (configuracion?.impresoras?.formatoTicket || configuracion?.impresora?.formatoTicket || configuracion?.formatoTicket) || {};
      const encabezado = formatoTicket.encabezado || 'Ticket de Estacionamiento';
      const piePagina = formatoTicket.piePagina || '¡Gracias por su visita!';

      // Procesar saltos de línea en encabezado y pie de página
      const encabezadoHtml = (encabezado || '').replace(/\n/g, '<br/>');
      const piePaginaHtml = (piePagina || '').replace(/\n/g, '<br/>');

      // Generar el contenido del ticket con todo en negrita
      const ticketHtml = `
        <html>
        <head>
          <title>Ticket</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 14px; margin: 0; padding: 20px; }
            .ticket { max-width: 320px; margin: 0 auto; }
            .centrado { text-align: center; }
            .separador { border-top: 1px dashed #000; margin: 10px 0; }
            strong { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="separador"></div>
            <div class="centrado"><strong>${encabezadoHtml}</strong></div>
            <div class="separador"></div>
            <div><strong>Espacio:</strong> <strong>${datosTicket.espacio}</strong></div>
            <div><strong>Patente:</strong> <strong>${datosTicket.patente}</strong></div>
            <div><strong>Hora Entrada:</strong> <strong>${datosTicket.horaEntrada}</strong></div>
            <div><strong>Hora Salida:</strong> <strong>${datosTicket.horaSalida}</strong></div>
            <div><strong>Tiempo Total:</strong> <strong>${datosTicket.tiempoTotal}</strong></div>
            <div><strong>Tarifa por Hora:</strong> <strong>$${datosTicket.tarifaHora?.toLocaleString('es-CL')}</strong></div>
            <div><strong>Costo Total:</strong> <strong>$${datosTicket.costoTotal?.toLocaleString('es-CL')}</strong></div>
            <div class="separador"></div>
            <div><strong>Fecha:</strong></div>
            <div><strong>${datosTicket.fecha}</strong></div>
            <div class="centrado" style="margin-top:10px;"><strong>${piePaginaHtml}</strong></div>
            <div class="separador"></div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
            window.onafterprint = function() {
              if (window.opener) {
                window.opener.postMessage({ tipo: 'ticket_impreso', id: '${registro.id}' }, '*');
              }
              window.close();
            };
          </script>
        </body>
        </html>
      `;

      // Abrir ventana emergente solo con el ticket
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(ticketHtml);
        printWindow.document.close();
      } else {
        showToast('error', 'No se pudo abrir la ventana de impresión.');
        return;
      }

      // Escuchar el mensaje de la ventana emergente para actualizar el estado SOLO después de imprimir
      const onTicketImpreso = async (event: MessageEvent) => {
        if (event.data && event.data.tipo === 'ticket_impreso' && event.data.id === registro.id) {
          if (registro.estado === 'PENDIENTE') {
            await actualizarEstadoHistorial(registro.id, 'FINALIZADO');
            setHistorial(prevHistorial =>
              prevHistorial.map(item =>
                item.id === registro.id
                  ? { ...item, estado: 'FINALIZADO' }
                  : item
              )
            );
            showToast('success', 'Ticket impreso correctamente y estado actualizado a FINALIZADO.');
          } else {
            showToast('success', 'Ticket reimpreso correctamente.');
          }
          window.removeEventListener('message', onTicketImpreso);
        }
      };
      window.addEventListener('message', onTicketImpreso);
    } catch (error) {
      console.error('Error al imprimir:', error);
      showToast('error', 'Error al imprimir el ticket.');
    }
  };

  // Función específica para reimpresión
  const handleReimprimir = async (registro: RegistroHistorial) => {
    try {
      // Formatear tiempo total para el ticket
      const formatearTiempoTicket = (segundos: number): string => {
        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        const segs = segundos % 60;
        
        if (horas > 0) {
          return `${horas}h ${minutos}m ${segs}s`;
        } else if (minutos > 0) {
          return `${minutos}m ${segs}s`;
        } else {
          return `${segs}s`;
        }
      };

      // Generar datos del ticket en formato térmico
      const datosTicket = {
        espacio: registro.espacio,
        patente: registro.patente,
        horaEntrada: registro.horaEntrada,
        horaSalida: registro.horaSalida,
        tiempoTotal: formatearTiempoTicket(registro.tiempoOcupado),
        tarifaHora: configuracion.tarifaHora,
        costoTotal: registro.costo,
        fecha: registro.fecha && !isNaN(new Date(registro.fecha).getTime())
          ? formatearFecha(registro.fecha, 'corto')
          : formatearFecha(Date.now(), 'corto')
      };

      // Usar el método térmico optimizado para Nippon Primex
      const resultado = await servicioImpresora.imprimirTicket(datosTicket);
      
      if (resultado.exito) {
        showToast('success', 'Ticket reimpreso correctamente.');
      } else {
        showToast('error', `Error al reimprimir: ${resultado.mensaje}`);
      }
    } catch (error) {
      console.error('Error al reimprimir:', error);
      showToast('error', 'Error al reimprimir el ticket.');
    }
  };

  // Paginación compacta inteligente
  function getPaginasCompactas(paginaActual: number, totalPaginas: number) {
    const paginas: (number | string)[] = [];
    if (totalPaginas <= 6) {
      for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
    } else {
      if (paginaActual <= 3) {
        paginas.push(1, 2, 3, 4, '...', totalPaginas);
      } else if (paginaActual >= totalPaginas - 2) {
        paginas.push(1, '...', totalPaginas - 3, totalPaginas - 2, totalPaginas - 1, totalPaginas);
      } else {
        paginas.push(1, '...', paginaActual - 1, paginaActual, paginaActual + 1, '...', totalPaginas);
      }
    }
    return paginas;
  }
  const paginasCompactas = getPaginasCompactas(pagina, totalPaginas);

  // Función para exportar a CSV (seguro, compatible con Excel)
  const exportarAExcel = () => {
    try {
      // Preparar datos para CSV
      const headers = ['Espacio', 'Patente', 'Hora Entrada', 'Hora Salida', 'Tiempo Total', 'Costo', 'Fecha', 'Estado'];
      
      const csvData = historialFiltrado.map(reg => [
        reg.espacio || '',
        reg.patente || '',
        reg.horaEntrada || '',
        reg.horaSalida || '',
        formatearTiempo(reg.tiempoOcupado),
        reg.costo ? `$${reg.costo.toLocaleString('es-CL')}` : '',
        calcularFecha(reg),
        reg.estado === 'FINALIZADO' ? 'Finalizado' : 'Pendiente'
      ]);

      // Crear contenido CSV
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Crear y descargar archivo con extensión .csv
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `historial_estacionamiento_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('success', 'Historial exportado correctamente.');
    } catch (error) {
      showToast('error', 'Error al exportar el historial.');
    }
  };

  // Función para abrir el modal y lanzar impresión
  const handleAbrirModalImpresion = (registro: RegistroHistorial) => {
    setModalImpresionAbierto(true);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Cerrar el modal automáticamente después de imprimir
  useEffect(() => {
    if (!modalImpresionAbierto) return;
    const cerrarModal = () => setModalImpresionAbierto(false);
    window.addEventListener('afterprint', cerrarModal);
    return () => window.removeEventListener('afterprint', cerrarModal);
  }, [modalImpresionAbierto]);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Historial de Tickets</h2>
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Buscar por patente..."
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setPagina(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
        <button
          onClick={exportarAExcel}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
          title="Exportar a Excel"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Exportar a Excel
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white text-xs">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-xs">
              <th className="px-2 py-2">Espacio</th>
              <th className="px-2 py-2">Patente</th>
              <th className="px-2 py-2">Entrada</th>
              <th className="px-2 py-2">Salida</th>
              <th className="px-2 py-2">Tiempo</th>
              <th className="px-2 py-2">Costo</th>
              <th className="px-2 py-2">Fecha</th>
              <th className="px-2 py-2">Estado</th>
              <th className="px-2 py-2">Acciones</th>
              <th className="px-2 py-2">Reimpresión</th>
            </tr>
          </thead>
          <tbody>
            {registrosPagina.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-gray-400">No hay registros</td>
              </tr>
            ) : (
              registrosPagina.map(reg => (
                <tr key={reg.id} className="border-b text-xs">
                  <td className="px-2 py-2 font-semibold">{reg.espacio}</td>
                  <td className="px-2 py-2">{reg.patente}</td>
                  <td className="px-2 py-2">{reg.horaEntrada}</td>
                  <td className="px-2 py-2">{reg.horaSalida}</td>
                  <td className="px-2 py-2">{formatearTiempo(reg.tiempoOcupado)}</td>
                  <td className="px-2 py-2">${reg.costo?.toLocaleString('es-CL')}</td>
                  <td className="px-2 py-2">
                    {calcularFecha(reg)}
                  </td>
                  <td className="px-2 py-2">
                    {reg.estado === 'FINALIZADO' ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">
                        <CheckCircle className="w-3 h-3 mr-1" /> Finalizado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 text-xs font-semibold">
                        <AlertCircle className="w-3 h-3 mr-1" /> Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {reg.estado && reg.estado.toUpperCase() === 'PENDIENTE' && (
                      <button
                        onClick={() => handleImprimir(reg)}
                        className="p-1.5 rounded-full bg-blue-500 hover:bg-blue-700 text-white transition-colors"
                        title="Imprimir Ticket"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    )}
                    {reg.estado && reg.estado.toUpperCase() === 'FINALIZADO' && (
                      <span className="text-green-500"><CheckCircle className="w-4 h-4 inline" /></span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {reg.estado && reg.estado.toUpperCase() === 'FINALIZADO' && (
                      <button
                        onClick={() => handleReimprimir(reg)}
                        className="p-1.5 rounded-full bg-orange-500 hover:bg-orange-700 text-white transition-colors"
                        title="Reimprimir Ticket"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                    {reg.estado && reg.estado.toUpperCase() === 'PENDIENTE' && (
                      <span className="text-gray-400">--</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Información de paginación */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600">
          Mostrando {((pagina - 1) * PAGE_SIZE) + 1} - {Math.min(pagina * PAGE_SIZE, historialFiltrado.length)} de {historialFiltrado.length} registros
        </div>
        <div className="text-sm text-gray-600">
          Página {pagina} de {totalPaginas || 1}
        </div>
      </div>
      {/* Paginación con números de página compacta */}
      <div className="flex justify-center items-center mt-4 space-x-2">
        {paginasCompactas.map((num, idx) =>
          typeof num === 'number' ? (
            <button
              key={num}
              onClick={() => setPagina(num)}
              className={`px-3 py-1 rounded ${pagina === num ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {num}
            </button>
          ) : (
            <span key={"ellipsis-"+idx} className="px-2 text-gray-400">...</span>
          )
        )}
      </div>
    </div>
  );
};

export default Historial; 