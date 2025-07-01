import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

interface GraficosCardProps {
  datos: any;
}

const coloresEstado: Record<string, string> = {
  LIBRE: '#22c55e',
  OCUPADO: '#ef4444',
  PENDIENTE: '#f59e0b',
  VERIFICAR: '#f97316',
  'SIN_CONEXION': '#64748b',
};

const nombresEstado: Record<string, string> = {
  LIBRE: 'Libre',
  OCUPADO: 'Ocupado',
  PENDIENTE: 'Pendiente',
  VERIFICAR: 'Verificar',
  'SIN_CONEXION': 'Sin Conexión',
};

const GraficosCard: React.FC<GraficosCardProps> = ({ datos }) => {
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const renderGrafico = (tipo: 'barra' | 'linea' | 'dona' | 'barra-horizontal', datosGrafico: any[], color: string = '#2563eb') => {
    switch (tipo) {
      case 'barra':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={datosGrafico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={color} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'linea':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={datosGrafico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'dona':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={datosGrafico}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {datosGrafico.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'barra-horizontal':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={datosGrafico} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="value" fill={color} />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Gráfico no disponible</div>;
    }
  };

  const renderCard = (titulo: string, tipo: 'barra' | 'linea' | 'dona' | 'barra-horizontal', datosGrafico: any[], color: string = '#2563eb') => {
    return (
      <div key={titulo} className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{titulo}</h3>
        {datosGrafico && datosGrafico.length > 0 ? (
          renderGrafico(tipo, datosGrafico, color)
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-500">
            No hay datos disponibles
          </div>
        )}
      </div>
    );
  };

  // Preparar datos para el gráfico de barras por estado actual (solo LIBRE y OCUPADO)
  const datosEstadoActual = (datos.espaciosPorEstado || [])
    .filter((item: any) => item.estado === 'LIBRE' || item.estado === 'OCUPADO')
    .map((item: any) => ({
      name: item.espacio,
      estado: item.estado,
      value: 1, // Valor fijo para que todas las barras tengan la misma altura
    }));

  // Preparar datos para el gráfico de evolución de ocupación
  const datosEvolucion = datos.evolucionOcupacion || [];

  // Crear leyenda de estados (solo LIBRE y OCUPADO)
  const leyendaEstados = Object.entries(coloresEstado)
    .filter(([estado]) => estado === 'LIBRE' || estado === 'OCUPADO')
    .map(([estado, color]) => ({
      estado,
      color,
      nombre: nombresEstado[estado] || estado,
    }));

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Análisis y Gráficos</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de barras por estado actual - MEJORADO */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Estado Actual por Espacio</h3>
          {datosEstadoActual.length > 0 ? (
            <div>
              {/* Leyenda de colores */}
              <div className="flex flex-wrap gap-3 mb-4">
                {leyendaEstados.map((item) => (
                  <div key={item.estado} className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-sm" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-600">{item.nombre}</span>
                  </div>
                ))}
              </div>
              
              {/* Gráfico mejorado */}
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={datosEstadoActual} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                            <p className="font-semibold text-gray-800">{data.name}</p>
                            <p className="text-sm text-gray-600">
                              Estado: <span style={{ color: coloresEstado[data.estado] }}>
                                {nombresEstado[data.estado]}
                              </span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  >
                    {datosEstadoActual.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={coloresEstado[entry.estado] || '#64748b'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </div>

        {/* Gráfico de línea tipo electrocardiograma */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Evolución de Ocupación</h3>
          {datosEvolucion.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={datosEvolucion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hora" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ocupados" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </div>

        {/* Otros gráficos existentes (si los quieres mantener) */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ingresos por Día (Últimos 7 días)</h3>
          {datos.ingresosPorDia && datos.ingresosPorDia.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={datos.ingresosPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ocupación por Hora</h3>
          {datos.ocupacionPorHora && datos.ocupacionPorHora.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={datos.ocupacionPorHora}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GraficosCard; 