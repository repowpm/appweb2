import { useState, useEffect } from 'react';
import { onValue, DataSnapshot } from 'firebase/database';
import { estacionamientosRef, historialRef, configuracionRef, actualizarTarifa } from '../services/firebase';
import type { Espacio, RegistroHistorial, Configuracion } from '../types';

export const useEstacionamientos = () => {
  const [estacionamientos, setEstacionamientos] = useState<Record<string, Espacio>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onValue(
      estacionamientosRef,
      (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        setEstacionamientos(data || {});
        setLoading(false);
        setError(null);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { estacionamientos, loading, error };
};

export const useHistorial = () => {
  const [historial, setHistorial] = useState<RegistroHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onValue(
      historialRef,
      (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        if (data) {
          const historialArray = Object.entries(data).map(([id, registro]) => ({
            id,
            ...(registro as Omit<RegistroHistorial, 'id'>),
            estado: (registro as any).estado?.toUpperCase() === 'COMPLETADO' ? 'FINALIZADO' : (registro as any).estado?.toUpperCase() || 'PENDIENTE' // Normalizar estados
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
        setLoading(false);
        setError(null);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { historial, loading, error };
};

export const useConfiguracion = () => {
  const [configuracion, setConfiguracion] = useState<Configuracion>({ tarifaHora: 1000 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onValue(
      configuracionRef,
      (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        setConfiguracion(data || { tarifaHora: 1000 });
        setLoading(false);
        setError(null);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const actualizarTarifaHora = async (nuevaTarifa: number) => {
    try {
      await actualizarTarifa(nuevaTarifa);
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al actualizar tarifa');
      return false;
    }
  };

  return { configuracion, loading, error, actualizarTarifaHora };
}; 