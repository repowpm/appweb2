export const formatearTiempo = (segundos: number): string => {
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

export const formatearPrecio = (precio: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(precio);
};

export const formatearFecha = (timestamp: number | string, formato: 'corto' | 'largo' = 'largo'): string => {
  let fecha;
  if (typeof timestamp === 'string' && timestamp.includes('T')) {
    // Forzar zona local para strings ISO
    const partes = timestamp.split('T');
    if (partes.length === 2) {
      const [anio, mes, dia] = partes[0].split('-');
      const [hora, minuto] = partes[1].split(':');
      fecha = new Date(Number(anio), Number(mes) - 1, Number(dia), Number(hora), Number(minuto));
    } else {
      fecha = new Date(timestamp);
    }
  } else {
    fecha = new Date(timestamp);
  }
  if (isNaN(fecha.getTime())) return '--/--/---- --:--';
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  const horas = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  return `${dia}-${mes}-${anio} ${horas}:${minutos}`;
};

export const formatearHoraSegura = (dateString: string): string => {
  try {
    const fecha = new Date(dateString);
    return fecha.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return '--:--:--';
  }
};

export const normalizarFecha = (dateString: string): Date => {
  // Maneja timestamps numéricos y strings ISO
  if (typeof dateString === 'number') {
    return new Date(dateString);
  }
  return new Date(dateString);
};

export const calcularMetricas = (historial: any[]): any => {
  if (!historial || historial.length === 0) {
    return {
      ingresosTotales: 0,
      totalOcupaciones: 0,
      tiempoPromedio: 0,
      ingresosPromedio: 0,
      ocupacionesPorDia: 0,
      espacioMasUtilizado: '',
      patentesMasFrecuentes: [],
      ingresosPorDia: [],
      ocupacionPorHora: [],
      usoPorEspacio: []
    };
  }

  // Métricas básicas
  const ingresosTotales = historial.reduce((sum, reg) => sum + (reg.costo || 0), 0);
  const totalOcupaciones = historial.length;
  const tiempoPromedio = historial.reduce((sum, reg) => sum + (reg.tiempoOcupado || 0), 0) / totalOcupaciones;
  const ingresosPromedio = ingresosTotales / totalOcupaciones;

  // Análisis por espacio
  const usoPorEspacio = Object.entries(
    historial.reduce((acc, reg) => {
      if (reg && reg.espacio) {
        acc[reg.espacio] = (acc[reg.espacio] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>)
  ).map(([espacio, cantidad]) => ({ espacio, cantidad }));

  const espacioMasUtilizado = usoPorEspacio.length > 0 
    ? usoPorEspacio.reduce((max, actual) => 
        actual.cantidad > max.cantidad ? actual : max
      ).espacio
    : '';

  // Análisis por patente
  const patentesCount = historial.reduce((acc, reg) => {
    if (reg && reg.patente) {
      acc[reg.patente] = (acc[reg.patente] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const patentesMasFrecuentes = Object.entries(patentesCount)
    .map(([patente, cantidad]) => ({ patente, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  // Análisis por día (últimos 30 días)
  const ahora = Date.now();
  const treintaDiasAtras = ahora - (30 * 24 * 60 * 60 * 1000);
  const historialReciente = historial.filter(reg => reg && reg.timestamp && reg.timestamp >= treintaDiasAtras);
  
  const ocupacionesPorDia = historialReciente.length / 30;

  // Análisis ingresos por día (últimos 7 días)
  const sieteDiasAtras = ahora - (7 * 24 * 60 * 60 * 1000);
  const historialSieteDias = historial.filter(reg => reg && reg.timestamp && reg.timestamp >= sieteDiasAtras);
  
  const ingresosPorDia = Object.entries(
    historialSieteDias.reduce((acc, reg) => {
      if (reg && reg.timestamp) {
        const fecha = new Date(reg.timestamp).toLocaleDateString('es-CL');
        acc[fecha] = (acc[fecha] || 0) + (reg.costo || 0);
      }
      return acc;
    }, {} as Record<string, number>)
  ).map(([fecha, ingreso]) => ({ fecha, ingreso }));

  // Análisis por hora
  const ocupacionPorHora = Object.entries(
    historial.reduce((acc, reg) => {
      if (reg && reg.horaEntrada) {
        try {
          const hora = new Date(`2024-01-01 ${reg.horaEntrada}`).getHours().toString();
          acc[hora] = (acc[hora] || 0) + 1;
        } catch (error) {
          console.error('Error procesando hora de entrada:', reg.horaEntrada);
        }
      }
      return acc;
    }, {} as Record<string, number>)
  ).map(([hora, cantidad]) => ({ hora, cantidad }));

  return {
    ingresosTotales,
    totalOcupaciones,
    tiempoPromedio,
    ingresosPromedio,
    ocupacionesPorDia,
    espacioMasUtilizado,
    patentesMasFrecuentes,
    ingresosPorDia,
    ocupacionPorHora,
    usoPorEspacio
  };
}; 