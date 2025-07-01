import React from 'react';
import { DollarSign, Car, Clock, TrendingUp, PieChart } from 'lucide-react';
import { formatearPrecio, formatearTiempo } from '../../utils/calculos';

interface MetricasCardProps {
  metricas: any;
}

const MetricasCard: React.FC<MetricasCardProps> = ({ metricas }) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'primary':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'success':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'danger':
        return 'bg-red-50 text-red-600 border-red-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const formatValue = (value: string | number, titulo: string) => {
    if (typeof value === 'number') {
      // Para ingresos totales y cualquier valor monetario
      if (titulo.toLowerCase().includes('ingreso') || titulo.toLowerCase().includes('costo') || titulo.toLowerCase().includes('precio')) {
        return formatearPrecio(value);
      }
      
      // Para tiempo promedio
      if (titulo.toLowerCase().includes('tiempo')) {
        if (value < 60) {
          // Segundos
          return `${value.toFixed(1)}s`;
        } else if (value < 3600) {
          // Minutos
          return `${(value / 60).toFixed(1)}m`;
        } else {
          // Horas y minutos
          const horas = Math.floor(value / 3600);
          const minutos = ((value % 3600) / 60).toFixed(1);
          return `${horas}h ${minutos}m`;
        }
      }
      
      // Para ocupación actual (porcentaje)
      if (titulo.toLowerCase().includes('ocupación actual')) {
        return `${Math.round(value)}%`;
      }
      
      // Para ocupaciones por día (números decimales pequeños)
      if (titulo.toLowerCase().includes('ocupaciones por día') || titulo.toLowerCase().includes('por día')) {
        return value.toFixed(1);
      }
      
      // Para otros números, redondear a 2 decimales máximo
      return value.toLocaleString('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    }
    return value;
  };

  // Calcular porcentaje de ocupación actual
  const totalEspacios = metricas.totalEspacios || 0;
  const ocupados = metricas.ocupados || 0;
  const porcentajeOcupacion = totalEspacios > 0 ? (ocupados / totalEspacios) * 100 : 0;

  const renderCard = (titulo: string, valor: string | number, icono: React.ComponentType<{ className?: string }>, color: 'primary' | 'success' | 'warning' | 'danger', descripcion?: string) => {
    const Icon = icono;
    
    return (
      <div key={titulo} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-600 truncate">{titulo}</p>
            <p className="text-xl font-bold text-gray-900 mt-1 truncate">
              {formatValue(valor, titulo)}
            </p>
            {descripcion && (
              <p className="text-xs text-gray-500 mt-1 truncate">{descripcion}</p>
            )}
          </div>
          <div className={`p-3 rounded-full border ${getColorClasses(color)} flex-shrink-0 ml-3`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {renderCard(
        "Ingresos Totales",
        metricas.ingresosTotales || 0,
        DollarSign,
        "success",
        "Total acumulado"
      )}
      {renderCard(
        "Total Ocupaciones",
        metricas.totalOcupaciones || 0,
        Car,
        "primary",
        "Registros en historial"
      )}
      {renderCard(
        "Tiempo Promedio",
        metricas.tiempoPromedio || 0,
        Clock,
        "warning",
        "Por ocupación"
      )}
      {renderCard(
        "Ocupación actual",
        porcentajeOcupacion,
        PieChart,
        "danger",
        `${ocupados} de ${totalEspacios} espacios ocupados`
      )}
    </div>
  );
};

export default MetricasCard; 