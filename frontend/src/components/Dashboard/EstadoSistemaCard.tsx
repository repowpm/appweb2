import React from 'react';
import { Database, Wifi, Printer } from 'lucide-react';

interface EstadoSistemaCardProps {
  impresora?: any;
}

const EstadoSistemaCard: React.FC<EstadoSistemaCardProps> = ({ impresora }) => {
  const getImpresoraColor = (estado: string) => {
    switch (estado) {
      case 'conectada':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-400 h-full flex flex-col justify-between">
      <h3 className="text-lg font-bold text-gray-800 mb-2">Estado del Sistema</h3>
      <div className="space-y-3 flex-1">
        <div className="flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          <Database className="w-4 h-4 mr-2 text-green-600" />
          <span className="text-sm">Base de datos: <span className="font-semibold">Conectado</span></span>
        </div>
        <div className="flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          <Wifi className="w-4 h-4 mr-2 text-green-600" />
          <span className="text-sm">Tiempo real: <span className="font-semibold">Activo</span></span>
        </div>
        <div className="flex items-center">
          <span className={`w-2 h-2 rounded-full mr-2 ${getImpresoraColor(impresora?.conexion?.estado)}`}></span>
          <Printer className="w-4 h-4 mr-2 text-blue-600" />
          <span className="text-sm">Impresora: <span className="font-semibold">{impresora?.conexion?.estado || 'Desconocida'}</span></span>
        </div>
      </div>
    </div>
  );
};

export default EstadoSistemaCard; 