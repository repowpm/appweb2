import React, { useState, useEffect } from 'react';
import { servicioImpresora } from '../services/impresora';

const TestConnection: React.FC = () => {
  const [estado, setEstado] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [mensaje, setMensaje] = useState('');
  const [detalles, setDetalles] = useState<string[]>([]);
  const [modalImpresionAbierto, setModalImpresionAbierto] = useState(false);

  const verificarNavegador = () => {
    const detalles = [];
    
    // Verificar soporte de impresión
    if (typeof window.print !== 'undefined') {
      detalles.push('✅ API de impresión disponible');
    } else {
      detalles.push('❌ API de impresión no disponible');
    }

    // Verificar ventanas emergentes
    if (typeof window.open !== 'undefined') {
      detalles.push('✅ Ventanas emergentes habilitadas');
    } else {
      detalles.push('❌ Ventanas emergentes bloqueadas');
    }

    // Verificar si estamos en HTTPS o localhost
    if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
      detalles.push('✅ Conexión segura o localhost');
    } else {
      detalles.push('❌ Conexión no segura - Use HTTPS o localhost');
    }

    // Verificar permisos de impresión
    if (navigator.permissions) {
      detalles.push('✅ API de permisos disponible');
    } else {
      detalles.push('❌ API de permisos no disponible');
    }

    setDetalles(detalles);
  };

  const probarConexion = async () => {
    try {
      setEstado('testing');
      setMensaje('Validando conexión con impresora predeterminada...');

      const resultado = await servicioImpresora.validarConexion();
      
      if (resultado.exito) {
        setEstado('success');
        setMensaje(resultado.mensaje);
      } else {
        setEstado('error');
        setMensaje(resultado.mensaje);
      }
    } catch (error) {
      setEstado('error');
      setMensaje(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const imprimirPrueba = async () => {
    try {
      setEstado('testing');
      setMensaje('Abriendo ventana de impresión de prueba...');

      const resultado = await servicioImpresora.probarConexion();
      
      if (resultado.exito) {
        setEstado('success');
        setMensaje(resultado.mensaje);
      } else {
        setEstado('error');
        setMensaje(resultado.mensaje);
      }
    } catch (error) {
      setEstado('error');
      setMensaje(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const getEstadoColor = () => {
    switch (estado) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'testing': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  // Función para abrir el modal y lanzar impresión
  const handleAbrirModalImpresion = () => {
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
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Prueba de Impresora Predeterminada</h2>
      
      {/* Información del navegador */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Estado del Navegador</h3>
        <button
          onClick={verificarNavegador}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Verificar Navegador
        </button>
        
        {detalles.length > 0 && (
          <div className="mt-3 space-y-1">
            {detalles.map((detalle, index) => (
              <p key={index} className="text-sm font-mono">{detalle}</p>
            ))}
          </div>
        )}
      </div>

      {/* Pruebas de conexión */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Pruebas de Impresión</h3>
        <div className="flex gap-2 mb-3">
          <button
            onClick={probarConexion}
            disabled={estado === 'testing'}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            Validar Conexión
          </button>
          <button
            onClick={imprimirPrueba}
            disabled={estado === 'testing'}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            Imprimir Prueba
          </button>
        </div>
      </div>

      {/* Estado actual */}
      {mensaje && (
        <div className="mt-6 p-4 bg-gray-50 rounded border">
          <h4 className="font-semibold text-gray-700 mb-2">Estado Actual:</h4>
          <p className={`font-mono ${getEstadoColor()}`}>{mensaje}</p>
        </div>
      )}

      {/* Información adicional */}
      <div className="mt-6 p-4 bg-blue-50 rounded border">
        <h4 className="font-semibold text-blue-800 mb-2">Información Importante:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• La aplicación usa la impresora predeterminada de Windows</li>
          <li>• Configure su impresora Nippon Primex como predeterminada</li>
          <li>• Asegúrese de que la impresora esté encendida y conectada</li>
          <li>• El navegador abrirá una ventana de impresión</li>
          <li>• Seleccione su impresora térmica en el diálogo de impresión</li>
        </ul>
      </div>

      {/* Instrucciones de configuración */}
      <div className="mt-6 p-4 bg-green-50 rounded border">
        <h4 className="font-semibold text-green-800 mb-2">Configuración en Windows:</h4>
        <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
          <li>Conecte la impresora Nippon Primex por USB</li>
          <li>Instale los drivers de la impresora</li>
          <li>Vaya a Configuración → Dispositivos → Impresoras y escáneres</li>
          <li>Haga clic derecho en su impresora Nippon Primex</li>
          <li>Seleccione "Establecer como predeterminada"</li>
          <li>Verifique que aparezca como "Predeterminada"</li>
        </ol>
      </div>
    </div>
  );
};

export default TestConnection; 