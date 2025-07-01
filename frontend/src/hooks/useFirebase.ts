import { useState, useEffect } from 'react';
import { onValue, DataSnapshot } from 'firebase/database';
import { estacionamientosRef, historialRef, configuracionRef, actualizarTarifa } from '../services/firebase';
import { Espacio, RegistroHistorial, Configuracion } from '../types';

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
            ...(registro as Omit<RegistroHistorial, 'id'>)
          }));
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