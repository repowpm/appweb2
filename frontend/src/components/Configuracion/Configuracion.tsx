import React, { useState, useEffect } from 'react';
import { onValue, ref, set, get, update } from 'firebase/database';
import { database } from '../../services/firebase';
import { Printer, Settings, Save, DollarSign, X, RefreshCw, Thermometer } from 'lucide-react';
import { useToast } from '../Layout/ToastContext';
import { servicioImpresora } from '../../services/impresora';

const Configuracion: React.FC = () => {
  const { showToast } = useToast();
  const [tarifaHora, setTarifaHora] = useState<number | null>(null);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [validandoConexion, setValidandoConexion] = useState(false);
  const [probandoConexion, setProbandoConexion] = useState(false);
  const [probandoCorte, setProbandoCorte] = useState(false);
  
  // Estado de configuración de impresora térmica
  const [configImpresora, setConfigImpresora] = useState({
    nombre: '',
    anchoPapel: 80, // Fijo para Nippon Primex
    puerto: '',
    resolucion: 300, // Por defecto 300 DPI
    modelo: 'NPI_IG3.0.7.0_20180919E',
    alineacion: 'centro' as 'izquierda' | 'centro' | 'derecha',
    tamañoFuente: 'normal' as 'pequena' | 'normal' | 'grande',
    mostrarSeparadores: false,
    mostrarLogo: false,
    encabezado: '',
    piePagina: '',
    configuracionCorte: {
      tipoCorte: 'completo' as 'completo' | 'parcial' | 'desconectado',
      margenCorte: 3,
      cortarAutomaticamente: true
    },
    conexion: {
      estado: 'desconectada' as 'conectada' | 'error' | 'desconectada' | 'verificando',
      ultimaVerificacion: '',
      mensajeError: ''
    }
  });

  // Estado para el acordeón
  const [openAccordion, setOpenAccordion] = useState<'impresora' | 'tarifa' | null>(null);

  useEffect(() => {
    const configuracionRef = ref(database, 'configuracion');
    const unsubscribe = onValue(configuracionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTarifaHora(data.tarifaHora || null);
        
        // Manejar tanto estructura nueva (impresoras) como antigua (impresora)
        const datosImpresora = data.impresoras || data.impresora || {};
        
        if (datosImpresora.nombre || data.impresoras || data.impresora) {
          setConfigImpresora(prev => ({
            nombre: datosImpresora.nombre || data.nombre || '',
            anchoPapel: datosImpresora.anchoPapel || data.anchoPapel || 80, // Fijo para Nippon Primex
            puerto: datosImpresora.puerto || '',
            resolucion: datosImpresora.resolucion || 300,
            modelo: datosImpresora.modelo || 'NPI_IG3.0.7.0_20180919E',
            alineacion: datosImpresora.formatoTicket?.alineacionTitulo || 'centro',
            tamañoFuente: datosImpresora.formatoTicket?.tamañoFuente || 'normal',
            mostrarSeparadores: datosImpresora.formatoTicket?.mostrarSeparadores || false,
            mostrarLogo: datosImpresora.formatoTicket?.mostrarLogo || false,
            encabezado: (datosImpresora.formatoTicket?.encabezado !== undefined ? datosImpresora.formatoTicket?.encabezado : prev.encabezado),
            piePagina: (datosImpresora.formatoTicket?.piePagina !== undefined ? datosImpresora.formatoTicket?.piePagina : prev.piePagina),
            configuracionCorte: datosImpresora.configuracionCorte || {
              tipoCorte: 'completo',
              margenCorte: 3,
              cortarAutomaticamente: true
            },
            conexion: datosImpresora.conexion || data.conexion || { estado: 'desconectada' }
          }));
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGuardarImpresora = async () => {
    setGuardando(true);
    try {
      const configuracionRef = ref(database, 'configuracion');
      // Solo actualizar la sección de impresoras
      const datosImpresoras = {
        impresoras: {
          nombre: configImpresora.nombre,
          tipo: 'termica',
          anchoPapel: configImpresora.anchoPapel,
          puerto: configImpresora.puerto,
          resolucion: configImpresora.resolucion,
          modelo: configImpresora.modelo,
          formatoTicket: {
            alineacionTitulo: configImpresora.alineacion,
            tamañoFuente: configImpresora.tamañoFuente,
            encabezado: configImpresora.encabezado ?? '',
            piePagina: configImpresora.piePagina ?? '',
            mostrarSeparadores: configImpresora.mostrarSeparadores,
            mostrarLogo: configImpresora.mostrarLogo
          },
          configuracionCorte: {
            tipoCorte: configImpresora.configuracionCorte.tipoCorte,
            margenCorte: configImpresora.configuracionCorte.margenCorte,
            cortarAutomaticamente: configImpresora.configuracionCorte.cortarAutomaticamente
          },
          conexion: {
            estado: configImpresora.conexion.estado,
            ultimaVerificacion: configImpresora.conexion.ultimaVerificacion,
            mensajeError: configImpresora.conexion.mensajeError
          }
        }
      };
      // Actualizar solo la sección de impresoras sin afectar otros datos
      await update(configuracionRef, datosImpresoras);
      setEditando(false);
      showToast('success', 'Configuración de impresora guardada correctamente en Firebase.');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      showToast('error', 'Error al guardar la configuración en Firebase.');
    } finally {
      setGuardando(false);
    }
  };

  const handleValidarConexion = async () => {
    setValidandoConexion(true);
    try {
      const resultado = await servicioImpresora.validarConexion();
      if (resultado.exito) {
        // Actualizar estado de conexión en Firebase y local
        const configuracionRef = ref(database, 'configuracion/impresoras/conexion');
        await update(configuracionRef, { estado: 'conectada', ultimaVerificacion: new Date().toISOString(), mensajeError: '' });
        setConfigImpresora(prev => ({
          ...prev,
          conexion: {
            ...prev.conexion,
            estado: 'conectada',
            ultimaVerificacion: new Date().toISOString(),
            mensajeError: ''
          }
        }));
        showToast('success', resultado.mensaje);
      } else {
        showToast('error', resultado.mensaje);
      }
    } catch (error) {
      showToast('error', 'Error al validar la conexión de la impresora');
    } finally {
      setValidandoConexion(false);
    }
  };

  const handleProbarConexion = async () => {
    setProbandoConexion(true);
    try {
      const resultado = await servicioImpresora.probarConexion();
      if (resultado.exito) {
        // Actualizar estado de conexión en Firebase y local
        const configuracionRef = ref(database, 'configuracion/impresoras/conexion');
        await update(configuracionRef, { estado: 'conectada', ultimaVerificacion: new Date().toISOString(), mensajeError: '' });
        setConfigImpresora(prev => ({
          ...prev,
          conexion: {
            ...prev.conexion,
            estado: 'conectada',
            ultimaVerificacion: new Date().toISOString(),
            mensajeError: ''
          }
        }));
        showToast('success', resultado.mensaje);
      } else {
        showToast('error', resultado.mensaje);
      }
    } catch (error) {
      showToast('error', 'Error al probar la conexión de la impresora');
    } finally {
      setProbandoConexion(false);
    }
  };

  const handleProbarCorte = async () => {
    setProbandoCorte(true);
    try {
      const resultado = await servicioImpresora.probarCorte();
      if (resultado.exito) {
        showToast('success', resultado.mensaje);
      } else {
        showToast('error', resultado.mensaje);
      }
    } catch (error) {
      showToast('error', 'Error al probar el corte de la impresora');
    } finally {
      setProbandoCorte(false);
    }
  };



  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Configuración</h2>

      {/* Acordeón: Configuración de impresora térmica */}
      <div className="mb-4 border rounded-lg overflow-hidden">
        <button
          className={`w-full flex justify-between items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 focus:outline-none ${openAccordion === 'impresora' ? 'border-b' : ''}`}
          onClick={() => setOpenAccordion(openAccordion === 'impresora' ? null : 'impresora')}
        >
          <span className="font-semibold text-gray-800">Configuración de impresora térmica</span>
          <span>{openAccordion === 'impresora' ? '▲' : '▼'}</span>
        </button>
        {openAccordion === 'impresora' && (
          <div className="p-4 bg-white">
            <div className="max-w-6xl mx-auto p-6">
              <div className="bg-white rounded-lg shadow-md mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Printer className="w-5 h-5 mr-2" />
                    Configuración de Impresora Térmica
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  
                  {/* Información de la impresora */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Thermometer className="w-5 h-5 mr-2 text-blue-600" />
                      <span className="font-medium text-blue-800">Nippon Primex IG3</span>
                    </div>
                    <p className="text-sm text-blue-700">Impresora térmica de 80mm con resolución de 300 DPI</p>
                    {configImpresora.nombre && (
                      <div className="mt-2 text-xs text-blue-600">
                        Configurada: {configImpresora.nombre}
                      </div>
                    )}
                  </div>

                  {/* Configuración básica */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800 border-b border-gray-200 pb-2">
                      Configuración Básica
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Impresora</label>
                        <input
                          type="text"
                          value={configImpresora.nombre}
                          onChange={(e) => setConfigImpresora({
                            ...configImpresora,
                            nombre: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nippon Primex IG3"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Nombre de la impresora predeterminada en Windows
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                        <input
                          type="text"
                          value={configImpresora.modelo || ''}
                          onChange={(e) => setConfigImpresora({
                            ...configImpresora,
                            modelo: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="NPI_IG3.0.7.0_20180919E"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Modelo específico de la impresora
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Resolución (DPI)</label>
                        <select
                          value={configImpresora.resolucion || 300}
                          onChange={(e) => setConfigImpresora({
                            ...configImpresora,
                            resolucion: parseInt(e.target.value)
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={200}>200 DPI</option>
                          <option value={300}>300 DPI (Recomendado)</option>
                          <option value={600}>600 DPI</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Resolución de impresión de la impresora térmica
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Configuración de formato */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800 border-b border-gray-200 pb-2">
                      Configuración de Formato
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alineación</label>
                        <select
                          value={configImpresora.alineacion}
                          onChange={(e) => setConfigImpresora({
                            ...configImpresora,
                            alineacion: e.target.value as 'izquierda' | 'centro' | 'derecha'
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="izquierda">Izquierda</option>
                          <option value="centro">Centro</option>
                          <option value="derecha">Derecha</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño Fuente</label>
                        <select
                          value={configImpresora.tamañoFuente}
                          onChange={(e) => setConfigImpresora({
                            ...configImpresora,
                            tamañoFuente: e.target.value as 'pequena' | 'normal' | 'grande'
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pequena">Pequeña</option>
                          <option value="normal">Normal</option>
                          <option value="grande">Grande</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="mostrarSeparadores"
                          checked={configImpresora.mostrarSeparadores}
                          onChange={(e) => setConfigImpresora({
                            ...configImpresora,
                            mostrarSeparadores: e.target.checked
                          })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="mostrarSeparadores" className="ml-2 block text-sm text-gray-700">
                          Mostrar separadores en tickets
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="mostrarLogo"
                          checked={configImpresora.mostrarLogo}
                          onChange={(e) => setConfigImpresora({
                            ...configImpresora,
                            mostrarLogo: e.target.checked
                          })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="mostrarLogo" className="ml-2 block text-sm text-gray-700">
                          Mostrar logo en tickets
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Encabezado Personalizado</label>
                        <textarea
                          value={configImpresora.encabezado}
                          onChange={(e) => setConfigImpresora({
                            ...configImpresora,
                            encabezado: e.target.value
                          })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Texto del encabezado..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pie de Página Personalizado</label>
                        <textarea
                          value={configImpresora.piePagina}
                          onChange={(e) => setConfigImpresora({
                            ...configImpresora,
                            piePagina: e.target.value
                          })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Texto del pie de página..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Configuración de corte de papel */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800 border-b border-gray-200 pb-2 flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Configuración de Corte
                    </h4>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Corte</label>
                        <select
                          value={configImpresora.configuracionCorte.tipoCorte}
                          onChange={(e) => setConfigImpresora({
                            ...configImpresora,
                            configuracionCorte: { 
                              ...configImpresora.configuracionCorte, 
                              tipoCorte: e.target.value as 'completo' | 'parcial' | 'desconectado' 
                            } 
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="completo">Corte Completo</option>
                          <option value="parcial">Corte Parcial</option>
                          <option value="desconectado">Sin Corte</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Margen de Corte (líneas)</label>
                        <input
                          type="number"
                          value={configImpresora.configuracionCorte.margenCorte}
                          onChange={(e) => setConfigImpresora({
                            ...configImpresora,
                            configuracionCorte: { 
                              ...configImpresora.configuracionCorte, 
                              margenCorte: parseInt(e.target.value) || 3 
                            } 
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          max="10"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="cortarAutomaticamente"
                          checked={configImpresora.configuracionCorte.cortarAutomaticamente}
                          onChange={(e) => setConfigImpresora({
                            ...configImpresora,
                            configuracionCorte: { 
                              ...configImpresora.configuracionCorte, 
                              cortarAutomaticamente: e.target.checked 
                            } 
                          })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="cortarAutomaticamente" className="ml-2 block text-sm text-gray-700">
                          Cortar automáticamente
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Estado de conexión */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800 border-b border-gray-200 pb-2">
                      Estado de Conexión
                    </h4>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          configImpresora.conexion.estado === 'conectada' ? 'bg-green-500' :
                          configImpresora.conexion.estado === 'error' ? 'bg-red-500' :
                          configImpresora.conexion.estado === 'verificando' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}></div>
                        <span className="font-medium text-gray-800">Impresora Térmica</span>
                      </div>
                      <span className={`text-sm ${
                        configImpresora.conexion.estado === 'conectada' ? 'text-green-600' :
                        configImpresora.conexion.estado === 'error' ? 'text-red-600' :
                        configImpresora.conexion.estado === 'verificando' ? 'text-yellow-600' : 'text-gray-500'
                      }`}>
                        {configImpresora.conexion.estado === 'conectada' ? 'Conectada' :
                         configImpresora.conexion.estado === 'error' ? 'Error' :
                         configImpresora.conexion.estado === 'verificando' ? 'Verificando' : 'Desconectada'}
                      </span>
                    </div>

                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={handleValidarConexion}
                        disabled={validandoConexion}
                        className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors disabled:opacity-50"
                      >
                        Validar Conexión
                      </button>
                      <button
                        onClick={handleProbarConexion}
                        disabled={probandoConexion}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        Imprimir Prueba
                      </button>
                      <button
                        onClick={handleProbarCorte}
                        disabled={probandoCorte}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        Probar corte
                      </button>
                    </div>


                  </div>

                  {/* Botones de acción */}
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleGuardarImpresora}
                      disabled={guardando}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {guardando ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {guardando ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                    
                    <button
                      onClick={() => setEditando(!editando)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>



      {/* Acordeón: Tarifa por hora */}
      <div className="mb-4 border rounded-lg overflow-hidden">
        <button
          className={`w-full flex justify-between items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 focus:outline-none ${openAccordion === 'tarifa' ? 'border-b' : ''}`}
          onClick={() => setOpenAccordion(openAccordion === 'tarifa' ? null : 'tarifa')}
        >
          <span className="font-semibold text-gray-800">Tarifa por hora</span>
          <span>{openAccordion === 'tarifa' ? '▲' : '▼'}</span>
        </button>
        {openAccordion === 'tarifa' && (
          <div className="p-4 bg-white">
            <div className="flex items-center space-x-4">
              <span className="text-2xl font-bold text-blue-700">
                {tarifaHora !== null ? `$${tarifaHora.toLocaleString('es-CL')}` : '--'}
              </span>
              <span className="text-gray-600">por hora</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Este valor se obtiene en tiempo real desde <b>Firebase Realtime Database</b>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Configuracion; 