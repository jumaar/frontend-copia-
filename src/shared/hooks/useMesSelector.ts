import { useState, useEffect, useCallback } from 'react';

export interface MesItem {
  mes: number;
  año: number;
  fecha: string;
}

export function generarMesesHistoricos(fechaCreacion: string): MesItem[] {
  const fechaInicio = new Date(fechaCreacion);
  const fechaActual = new Date();
  const meses: MesItem[] = [];
  const fechaTemp = new Date(fechaInicio);

  while (fechaTemp <= fechaActual) {
    meses.push({
      mes: fechaTemp.getMonth() + 1,
      año: fechaTemp.getFullYear(),
      fecha: fechaTemp.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }),
    });
    fechaTemp.setMonth(fechaTemp.getMonth() + 1);
  }

  const mesActual = fechaActual.getMonth() + 1;
  const añoActual = fechaActual.getFullYear();
  const existeMesActual = meses.some(m => m.mes === mesActual && m.año === añoActual);

  if (!existeMesActual) {
    meses.push({
      mes: mesActual,
      año: añoActual,
      fecha: fechaActual.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }),
    });
  }

  return meses.reverse();
}

export function useMesSelector(fechaCreacion?: string) {
  const [mesesHistoricos, setMesesHistoricos] = useState<MesItem[]>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState<{ mes: number; año: number } | null>(null);

  useEffect(() => {
    if (fechaCreacion) {
      const meses = generarMesesHistoricos(fechaCreacion);
      setMesesHistoricos(meses);
      if (meses.length > 0 && mesSeleccionado === null) {
        setMesSeleccionado({ mes: meses[0].mes, año: meses[0].año });
      }
    }
  }, [fechaCreacion]);

  const consultarMesEspecifico = useCallback((mes: number, año: number) => {
    setMesSeleccionado({ mes, año });
  }, []);

  return {
    mesesHistoricos,
    mesSeleccionado,
    setMesesHistoricos,
    setMesSeleccionado,
    consultarMesEspecifico,
    generarMesesHistoricos,
  };
}
