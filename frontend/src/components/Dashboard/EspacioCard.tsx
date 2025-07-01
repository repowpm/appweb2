import React from 'react';
import { Car, Clock, DollarSign, Printer, AlertTriangle, RefreshCw } from 'lucide-react';
import { formatearTiempo, formatearPrecio } from '../../utils/calculos';

interface EspacioCardProps {
  espacioId: string;
  espacio: any;
  onVerificar?: (espacioId: string) => void;
  onFinalizar?: (espacioId: string) => Promise<void>;
  onImprimir?: (espacioId: string) => Promise<void>;
  procesando?: boolean;
}

const EspacioCard: React.FC<EspacioCardProps> = ({ 
  espacioId, 
  espacio, 
  onVerificar,
  onFinalizar,
  onImprimir,
  procesando
}) => {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'LIBRE':
        return 'bg-green-500 text-white';
      case 'OCUPADO':
        return 'bg-red-500 text-white';
      case 'PENDIENTE':
        return 'bg-yellow-500 text-white';
      case 'SIN_CONEXION':
        return 'bg-gray-500 text-white';
      case 'VERIFICAR':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getEstadoText = (estado: string) => {
    switch (estado) {
      case 'LIBRE':
        return 'LIBRE';
      case 'OCUPADO':
        return 'OCUPADO';
      case 'PENDIENTE':
        return 'PENDIENTE DE TICKET';
      case 'SIN_CONEXION':
        return 'SIN CONEXIÓN';
      case 'VERIFICAR':
        return 'VERIFICAR';
      default:
        return 'DESCONOCIDO';
    }
  };

  const calcularTiempoDesdeActualizacion = (): number => {
    if (!espacio.ultimaActualizacion) return 0;
    
    try {
      const ultimaActualizacion = new Date(espacio.ultimaActualizacion);
      const ahora = new Date();
      return Math.floor((ahora.getTime() - ultimaActualizacion.getTime()) / 1000);
    } catch (error) {
      return 0;
    }
  };

  const tiempoDesdeActualizacion = calcularTiempoDesdeActualizacion();
  const minutosDesdeActualizacion = Math.floor(tiempoDesdeActualizacion / 60);

  const getAlertaActualizacion = () => {
    if (espacio.estado === 'LIBRE') return null;
    
    if (minutosDesdeActualizacion > 30) {
      return { tipo: 'error', mensaje: `Sin actualización por ${minutosDesdeActualizacion} min` };
    } else if (minutosDesdeActualizacion > 10) {
      return { tipo: 'warning', mensaje: `Última actualización: ${minutosDesdeActualizacion} min` };
    } else if (minutosDesdeActualizacion > 0) {
      return { tipo: 'info', mensaje: `Actualizado hace ${minutosDesdeActualizacion} min` };
    }
    return null;
  };

  const alerta = getAlertaActualizacion();

  const formatearHoraSegura = (horaString: string): string => {
    try {
      if (horaString && horaString.includes(':')) {
        return horaString;
      }
      
      if (horaString && !isNaN(Number(horaString))) {
        const fecha = new Date(Number(horaString));
        return fecha.toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
      
      if (horaString) {
        const fecha = new Date(horaString);
        if (!isNaN(fecha.getTime())) {
          return fecha.toLocaleTimeString('es-CL', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        }
      }
      
      return '--:--:--';
    } catch (error) {
      console.error('Error formateando hora:', horaString, error);
      return '--:--:--';
    }
  };

  const calcularTiempoTranscurrido = (): number => {
    if (!espacio.horaEntrada || espacio.estado !== 'OCUPADO') return 0;
    
    try {
      let fechaEntrada: Date;
      
      if (espacio.horaEntrada.includes(':') && !espacio.horaEntrada.includes('-')) {
        const hoy = new Date();
        const [hora, minuto, segundo] = espacio.horaEntrada.split(':');
        fechaEntrada = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 
                               parseInt(hora), parseInt(minuto), parseInt(segundo));
      } else {
        fechaEntrada = new Date(espacio.horaEntrada);
      }
      
      if (isNaN(fechaEntrada.getTime())) {
        console.error('Fecha de entrada inválida:', espacio.horaEntrada);
        return 0;
      }
      
      const ahora = new Date();
      const tiempoTranscurrido = Math.floor((ahora.getTime() - fechaEntrada.getTime()) / 1000);
      
      return Math.max(0, tiempoTranscurrido);
    } catch (error) {
      console.error('Error calculando tiempo transcurrido:', error);
      return 0;
    }
  };

  const tiempoTranscurrido = calcularTiempoTranscurrido();

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 h-full flex flex-col ${
      espacio.estado === 'PENDIENTE' ? 'border-yellow-500' : 
      espacio.estado === 'VERIFICAR' ? 'border-orange-500' :
      espacio.estado === 'SIN_CONEXION' ? 'border-gray-500' :
      'border-blue-500'
    }`}>
      {/* Header con estado */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-800">{espacioId.toUpperCase()}</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getEstadoColor(espacio.estado)}`}>
          {getEstadoText(espacio.estado)}
        </span>
      </div>

      {/* Alerta de actualización */}
      {alerta && (
        <div className={`mb-3 p-2 rounded-md text-xs font-medium ${
          alerta.tipo === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          alerta.tipo === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          <div className="flex items-center">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {alerta.mensaje}
          </div>
        </div>
      )}

      {/* Contenido principal - flex-grow para ocupar espacio disponible */}
      <div className="flex-grow space-y-3">
        {espacio.estado === 'LIBRE' ? (
          <>
            {espacio.patente && (
              <div className="flex items-center text-gray-700">
                <Car className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                <span className="font-medium truncate">Patente: {espacio.patente}</span>
              </div>
            )}
            {espacio.horaEntrada && (
              <div className="flex items-center text-gray-700">
                <Clock className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                <span className="truncate">Entrada: {formatearHoraSegura(espacio.horaEntrada)}</span>
              </div>
            )}
            {espacio.horaSalida && (
              <div className="flex items-center text-gray-700">
                <Clock className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                <span className="truncate">Salida: {formatearHoraSegura(espacio.horaSalida)}</span>
              </div>
            )}
            {espacio.tiempoOcupado > 0 && (
              <div className="flex items-center text-gray-700">
                <Clock className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                <span className="truncate">Total: {formatearTiempo(espacio.tiempoOcupado)}</span>
              </div>
            )}
            {espacio.costo > 0 && (
              <div className="flex items-center text-green-600 font-semibold">
                <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">Costo: {formatearPrecio(espacio.costo)}</span>
              </div>
            )}
          </>
        ) : (
          <>
            {espacio.patente && (
              <div className="flex items-center text-gray-700">
                <Car className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                <span className="font-medium truncate">Patente: {espacio.patente}</span>
              </div>
            )}

            {espacio.horaEntrada && (
              <div className="flex items-center text-gray-700">
                <Clock className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                <span className="truncate">Entrada: {formatearHoraSegura(espacio.horaEntrada)}</span>
              </div>
            )}

            {espacio.estado === 'OCUPADO' && tiempoTranscurrido > 0 && (
              <div className="flex items-center text-orange-600 font-semibold">
                <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">Tiempo: {formatearTiempo(tiempoTranscurrido)}</span>
              </div>
            )}

            {espacio.tiempoOcupado > 0 && (
              <div className="flex items-center text-gray-700">
                <Clock className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                <span className="truncate">Total: {formatearTiempo(espacio.tiempoOcupado)}</span>
              </div>
            )}

            {espacio.costo > 0 && (
              <div className="flex items-center text-green-600 font-semibold">
                <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">Costo: {formatearPrecio(espacio.costo)}</span>
              </div>
            )}

            {espacio.estado === 'LIBRE' && espacio.horaSalida && (
              <div className="flex items-center text-gray-700">
                <Clock className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                <span className="truncate">Salida: {formatearHoraSegura(espacio.horaSalida)}</span>
              </div>
            )}

            {/* Estados especiales */}
            {espacio.estado === 'PENDIENTE' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-center text-yellow-800">
                  <Printer className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-sm font-medium">Listo para imprimir ticket</span>
                </div>
                <p className="text-xs text-yellow-600 mt-1">
                  El vehículo ha salido. Imprime el ticket para liberar el espacio.
                </p>
              </div>
            )}

            {espacio.estado === 'VERIFICAR' && (
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                <div className="flex items-center text-orange-800">
                  <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-sm font-medium">Verificar estado</span>
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  El estado de este espacio requiere verificación manual.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Botones de acción - siempre al final */}
      <div className="mt-4 space-y-2">
        {/* Botón de verificación para espacios problemáticos */}
        {(espacio.estado === 'VERIFICAR' || alerta?.tipo === 'error') && onVerificar && (
          <button
            onClick={() => onVerificar(espacioId)}
            className={`w-full font-medium py-2 px-4 rounded-md transition-colors ${
              'bg-orange-500 hover:bg-orange-700'
            } text-white`}
          >
            <div className="flex items-center justify-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Verificar Estado
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default EspacioCard; 