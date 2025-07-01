import React, { useState, useEffect, useRef } from 'react';
import { onValue, update, push, ref } from 'firebase/database';
import { estacionamientosRef, historialRef, configuracionRef } from '../../services/firebase';
import { servicioImpresora } from '../../services/impresora';
import { calcularMetricas } from '../../utils/calculos';
import EspacioCard from './EspacioCard';
import MetricasCard from './MetricasCard';
import GraficosCard from './GraficosCard';
import EstadoSistemaCard from './EstadoSistemaCard';
import { DollarSign, Car, Clock, TrendingUp, Monitor as MonitorIcon } from 'lucide-react';
import { useToast } from '../Layout/ToastContext';

const Dashboard: React.FC = () => {
  const [estacionamientos, setEstacionamientos] = useState<any>({});
  const [historial, setHistorial] = useState<any[]>([]);
  const [configuracion, setConfiguracion] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<any>({});
  const [procesando, setProcesando] = useState<string | null>(null);
  const { showToast } = useToast();
  const estacionamientosAnteriores = useRef<any>({});
  const [notificacionesDeshabilitadas, setNotificacionesDeshabilitadas] = useState(false);
  const notificacionesRecientes = useRef<Set<string>>(new Set());
  const timeoutNotificaciones = useRef<NodeJS.Timeout | null>(null);

  // Función para limpiar notificaciones recientes después de un delay
  const limpiarNotificacionesRecientes = () => {
    notificacionesRecientes.current.clear();
  };

  // Función para mostrar notificación con debounce
  const mostrarNotificacion = (tipo: 'success' | 'error' | 'info' | 'warning', mensaje: string, esManual: boolean = false) => {
    const clave = `${tipo}-${mensaje}`;
    
    // Si ya se mostró esta notificación recientemente, no la muestres
    if (notificacionesRecientes.current.has(clave)) {
      return;
    }
    
    // Para notificaciones automáticas, agregar un pequeño delay para evitar duplicados
    if (!esManual) {
      setTimeout(() => {
        // Verificar nuevamente si ya se mostró la notificación
        if (notificacionesRecientes.current.has(clave)) {
          return;
        }
        
        // Agregar a notificaciones recientes
        notificacionesRecientes.current.add(clave);
        
        // Mostrar la notificación
        showToast(tipo, mensaje);
        
        // Limpiar notificaciones recientes después de 3 segundos
        if (timeoutNotificaciones.current) {
          clearTimeout(timeoutNotificaciones.current);
        }
        timeoutNotificaciones.current = setTimeout(limpiarNotificacionesRecientes, 3000);
      }, 100); // Delay de 100ms para notificaciones automáticas
    } else {
      // Para notificaciones manuales, mostrar inmediatamente
      notificacionesRecientes.current.add(clave);
      showToast(tipo, mensaje);
      
      // Limpiar notificaciones recientes después de 3 segundos
      if (timeoutNotificaciones.current) {
        clearTimeout(timeoutNotificaciones.current);
      }
      timeoutNotificaciones.current = setTimeout(limpiarNotificacionesRecientes, 3000);
    }
  };

  useEffect(() => {
    const unsubscribeEst = onValue(estacionamientosRef, (snapshot) => {
      const data = snapshot.val();
      console.log('Datos de estacionamientos recibidos:', data);
      
      // Detectar cambios de estado y mostrar notificaciones
      if (data && Object.keys(estacionamientosAnteriores.current).length > 0 && !notificacionesDeshabilitadas) {
        Object.entries(data).forEach(([espacioId, espacio]: [string, any]) => {
          const espacioAnterior = estacionamientosAnteriores.current[espacioId];
          
          if (espacioAnterior && espacioAnterior.estado !== espacio.estado) {
            // Detectar cambio de LIBRE a OCUPADO
            if (espacioAnterior.estado === 'LIBRE' && espacio.estado === 'OCUPADO') {
              mostrarNotificacion('info', `🚗 Espacio ${espacioId.toUpperCase()} ocupado`);
            }
            // Detectar cambio de OCUPADO/PENDIENTE a LIBRE
            else if ((espacioAnterior.estado === 'OCUPADO' || espacioAnterior.estado === 'PENDIENTE') && espacio.estado === 'LIBRE') {
              mostrarNotificacion('success', `✅ Espacio ${espacioId.toUpperCase()} disponible`);
            }
            // Detectar cambio de OCUPADO a PENDIENTE
            else if (espacioAnterior.estado === 'OCUPADO' && espacio.estado === 'PENDIENTE') {
              mostrarNotificacion('warning', `⏳ Espacio ${espacioId.toUpperCase()} listo para ticket`);
            }
            // Detectar cambio a VERIFICAR
            else if (espacioAnterior.estado !== 'VERIFICAR' && espacio.estado === 'VERIFICAR') {
              mostrarNotificacion('error', `⚠️ Espacio ${espacioId.toUpperCase()} requiere verificación`);
            }
          }
        });
      }
      
      setEstacionamientos(data || {});
      estacionamientosAnteriores.current = data || {};
    });

    const unsubscribeHist = onValue(historialRef, (snapshot) => {
      const data = snapshot.val();
      console.log('Datos de historial recibidos:', data);
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        try {
          const historialArray = Object.entries(data).map(([id, registro]) => ({
            id,
            ...(registro as any)
          }));
          setHistorial(historialArray);
        } catch (error) {
          console.error('Error procesando historial:', error);
          setHistorial([]);
        }
      } else {
        setHistorial([]);
      }
    });

    const unsubscribeConfig = onValue(configuracionRef, (snapshot) => {
      const data = snapshot.val();
      console.log('Datos de configuración recibidos:', data);
      setConfiguracion(data || { tarifaHora: 1000 });
      setLoading(false);
    });

    return () => {
      unsubscribeEst();
      unsubscribeHist();
      unsubscribeConfig();
      // Limpiar timeout de notificaciones
      if (timeoutNotificaciones.current) {
        clearTimeout(timeoutNotificaciones.current);
      }
    };
  }, [showToast]);

  useEffect(() => {
    if (historial.length > 0) {
      const metricasCalculadas = calcularMetricas(historial);
      setMetricas(metricasCalculadas);
    }
  }, [historial]);

  // Timeout automático: marcar espacios como VERIFICAR si no se actualizan en 35 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      const ahora = new Date();
      Object.entries(estacionamientos).forEach(([espacioId, espacio]: [string, any]) => {
        if (espacio.estado !== 'LIBRE' && espacio.ultimaActualizacion) {
          const ultima = new Date(espacio.ultimaActualizacion);
          const minutos = (ahora.getTime() - ultima.getTime()) / 60000;
          if (minutos > 35 && espacio.estado !== 'VERIFICAR') {
            update(ref(estacionamientosRef, espacioId), { ...espacio, estado: 'VERIFICAR' });
          }
        }
      });
    }, 60000); // cada minuto
    return () => clearInterval(interval);
  }, [estacionamientos]);

  const calcularTiempoOcupado = (horaEntrada: string): number => {
    try {
      let fechaEntrada: Date;
      
      // Si es solo hora (HH:MM:SS), crear fecha de hoy
      if (horaEntrada.includes(':') && !horaEntrada.includes('-')) {
        const hoy = new Date();
        const [hora, minuto, segundo] = horaEntrada.split(':');
        fechaEntrada = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 
                               parseInt(hora), parseInt(minuto), parseInt(segundo));
      } else {
        // Si es timestamp o fecha completa
        fechaEntrada = new Date(horaEntrada);
      }
      
      if (isNaN(fechaEntrada.getTime())) {
        console.error('Fecha de entrada inválida:', horaEntrada);
        return 3600; // 1 hora por defecto
      }
      
      const ahora = new Date();
      const tiempoOcupado = Math.floor((ahora.getTime() - fechaEntrada.getTime()) / 1000);
      
      return Math.max(3600, tiempoOcupado); // Mínimo 1 hora
    } catch (error) {
      console.error('Error calculando tiempo ocupado:', error);
      return 3600; // 1 hora por defecto
    }
  };

  const calcularCosto = (tiempoOcupado: number): number => {
    const tarifaHora = configuracion.tarifaHora || 1000; // pesos por hora
    const tarifaMinuto = tarifaHora / 60;
    const costo = Math.ceil(tiempoOcupado / 60) * tarifaMinuto; // Redondear hacia arriba por minuto
    return Math.max(tarifaMinuto, costo); // Mínimo 1 minuto
  };

  // Función para cambiar estado de OCUPADO a PENDIENTE
  const handleFinalizar = async (espacioId: string) => {
    try {
      setProcesando(espacioId);
      setNotificacionesDeshabilitadas(true);
      
      const espacio = estacionamientos[espacioId];
      if (!espacio || espacio.estado !== 'OCUPADO') {
        mostrarNotificacion('error', 'El espacio no está ocupado', true);
        return;
      }

      // Calcular tiempo ocupado y costo
      const tiempoOcupado = calcularTiempoOcupado(espacio.horaEntrada);
      const tarifaHora = configuracion.tarifaHora || 1000;
      const costo = Math.ceil(tiempoOcupado / 3600) * tarifaHora;

      // Generar hora de salida
      const ahora = new Date();
      const horaSalida = ahora.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Actualizar el espacio a estado PENDIENTE con datos del ticket
      const espacioActualizado = {
        ...espacio,
        estado: 'PENDIENTE',
        horaSalida: horaSalida,
        tiempoOcupado: tiempoOcupado,
        costo: costo,
        pendienteTicket: true
      };

      // Actualizar en Firebase
      await update(ref(estacionamientosRef, espacioId), espacioActualizado);

      mostrarNotificacion('success', `⏳ Espacio ${espacioId.toUpperCase()} pendiente - $${costo.toLocaleString('es-CL')}`, true);
      
    } catch (error) {
      console.error('Error finalizando espacio:', error);
      mostrarNotificacion('error', 'Error al finalizar el espacio. Intente nuevamente.', true);
    } finally {
      setProcesando(null);
      // Habilitar notificaciones después de un delay
      setTimeout(() => {
        setNotificacionesDeshabilitadas(false);
      }, 2000);
    }
  };

  // Función para imprimir ticket y liberar espacio
  const handleImprimir = async (espacioId: string) => {
    try {
      setProcesando(espacioId);
      setNotificacionesDeshabilitadas(true);
      
      const espacio = estacionamientos[espacioId];
      if (!espacio || espacio.estado !== 'PENDIENTE') {
        mostrarNotificacion('error', 'El espacio no está pendiente de ticket', true);
        return;
      }

      // Formatear tiempo total
      const formatearTiempo = (segundos: number): string => {
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

      // Generar ticket con datos completos
      const datosTicket = {
        espacio: espacioId.toUpperCase(),
        patente: espacio.patente || 'N/A',
        horaEntrada: espacio.horaEntrada,
        horaSalida: espacio.horaSalida,
        tiempoTotal: formatearTiempo(espacio.tiempoOcupado),
        tarifaHora: configuracion.tarifaHora || 1000,
        costoTotal: espacio.costo,
        fecha: new Date().toLocaleDateString('es-CL')
      };

      // Imprimir ticket
      servicioImpresora.imprimirTicket(datosTicket);

      // Agregar al historial
      const registroHistorial = {
        espacio: espacioId.toUpperCase(),
        patente: espacio.patente,
        horaEntrada: espacio.horaEntrada,
        horaSalida: espacio.horaSalida,
        tiempoOcupado: espacio.tiempoOcupado,
        costo: espacio.costo,
        fecha: new Date().toISOString(),
        estado: 'COMPLETADO'
      };

      await push(historialRef, registroHistorial);

      // Liberar el espacio (volver a LIBRE)
      const espacioLiberado = {
        estado: 'LIBRE',
        patente: null,
        horaEntrada: null,
        horaSalida: null,
        tiempoOcupado: null,
        costo: null,
        pendienteTicket: false
      };

      await update(ref(estacionamientosRef, espacioId), espacioLiberado);

      mostrarNotificacion('success', `✅ Ticket impreso - $${espacio.costo.toLocaleString('es-CL')} - Disponible en Historial`, true);
      
    } catch (error) {
      mostrarNotificacion('error', 'Error al imprimir el ticket o guardar en el historial.', true);
    } finally {
      setProcesando(null);
      // Habilitar notificaciones después de un delay
      setTimeout(() => {
        setNotificacionesDeshabilitadas(false);
      }, 2000);
    }
  };

  // Función de verificación manual
  const handleVerificar = async (espacioId: string) => {
    try {
      setProcesando(espacioId);
      setNotificacionesDeshabilitadas(true);
      
      // Aquí podrías mostrar un modal o pedir confirmación
      await update(ref(estacionamientosRef, espacioId), {
        estado: 'LIBRE',
        patente: null,
        horaEntrada: null,
        horaSalida: null,
        tiempoOcupado: null,
        costo: null,
        pendienteTicket: false,
        ultimaActualizacion: new Date().toISOString()
      });
      mostrarNotificacion('success', `✅ Espacio ${espacioId.toUpperCase()} liberado`, true);
    } catch (error) {
      mostrarNotificacion('error', 'Error al verificar el espacio.', true);
    } finally {
      setProcesando(null);
      // Habilitar notificaciones después de un delay
      setTimeout(() => {
        setNotificacionesDeshabilitadas(false);
      }, 2000);
    }
  };

  const prepararDatosGraficos = () => {
    // Datos para gráfico de uso por espacio (estado actual)
    const usoPorEspacio = Object.entries(estacionamientos).map(([espacio, data]: [string, any]) => ({
      name: espacio.toUpperCase(),
      value: data.estado === 'OCUPADO' ? 1 : data.estado === 'PENDIENTE' ? 0.5 : 0
    }));

    // Datos para gráfico de ingresos por día (últimos 7 días)
    const ingresosPorDia = metricas.ingresosPorDia?.slice(-7).map((item: any) => ({
      name: item.fecha,
      value: item.ingreso
    })) || [];

    // Datos para gráfico de ocupación por hora (formatear mejor)
    const ocupacionPorHora = metricas.ocupacionPorHora?.map((item: any) => ({
      name: `${item.hora}:00`,
      value: item.cantidad
    })) || [];

    // Datos para gráfico de patentes más frecuentes
    const patentesFrecuentes = metricas.patentesMasFrecuentes?.map((item: any) => ({
      name: item.patente,
      value: item.cantidad
    })) || [];

    // Datos para gráfico de uso histórico por espacio
    const usoHistoricoPorEspacio = metricas.usoPorEspacio?.map((item: any) => ({
      name: item.espacio,
      value: item.cantidad
    })) || [];

    return {
      usoPorEspacio,
      ingresosPorDia,
      ocupacionPorHora,
      patentesFrecuentes,
      usoHistoricoPorEspacio
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos del estacionamiento...</p>
        </div>
      </div>
    );
  }

  // Preparar datos para el gráfico de barras por estado actual
  const espaciosPorEstado = Object.entries(estacionamientos).map(([espacioId, espacio]: [string, any]) => ({
    espacio: espacioId.toUpperCase(),
    estado: espacio.estado || 'LIBRE',
  }));

  // Preparar datos para el gráfico de evolución de ocupación (por hora, últimas 24h)
  // Suponiendo que historial tiene registros con horaEntrada y horaSalida
  const horas = Array.from({ length: 24 }, (_, i) => i);
  const evolucionOcupacion = horas.map((h) => {
    // Contar cuántos registros del historial estuvieron ocupados en esa hora
    const ocupados = historial.filter((reg) => {
      if (!reg.horaEntrada || !reg.horaSalida) return false;
      const entrada = new Date(`2024-01-01T${reg.horaEntrada}`);
      const salida = new Date(`2024-01-01T${reg.horaSalida}`);
      return entrada.getHours() <= h && salida.getHours() >= h;
    }).length;
    return { hora: `${h}:00`, ocupados };
  });

  const datosGraficos = {
    espaciosPorEstado,
    evolucionOcupacion,
    ingresosPorDia: prepararDatosGraficos().ingresosPorDia,
    ocupacionPorHora: prepararDatosGraficos().ocupacionPorHora,
  };

  // Calcular total de espacios y ocupados
  const totalEspacios = Object.keys(estacionamientos).length;
  const ocupados = Object.values(estacionamientos).filter((esp: any) => esp.estado === 'OCUPADO' || esp.estado === 'PENDIENTE').length;

  // Pasar estos valores a las métricas
  const metricasConOcupacion = {
    ...metricas,
    totalEspacios,
    ocupados,
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Encabezado mejorado */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
          <MonitorIcon className="w-7 h-7 text-blue-500" />
          Dashboard
        </h1>
        <p className="text-gray-500 text-lg mt-2">Monitoreo en tiempo real del estacionamiento</p>
        <div className="border-b border-gray-200 mt-4"></div>
      </div>

      {/* Espacios - PRIMERO */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Estado de Espacios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {Object.entries(estacionamientos).map(([espacioId, espacio]: [string, any]) => (
            <EspacioCard
              key={espacioId}
              espacioId={espacioId}
              espacio={espacio}
              onFinalizar={handleFinalizar}
              onImprimir={handleImprimir}
              onVerificar={handleVerificar}
              procesando={procesando === espacioId}
            />
          ))}
          {/* Si hay menos de 4 espacios, agregar la card de Estado del Sistema para completar 4 */}
          {Object.keys(estacionamientos).length < 4 && (
            <EstadoSistemaCard impresora={configuracion?.impresora} />
          )}
        </div>
      </div>

      {/* Métricas - SEGUNDO */}
      <div className="mt-10">
        <MetricasCard metricas={metricasConOcupacion} />
      </div>

      {/* Gráficos - TERCERO */}
      <div className="mt-10">
        <GraficosCard datos={datosGraficos} />
      </div>
    </div>
  );
};

export default Dashboard; 