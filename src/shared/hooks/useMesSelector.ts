import { useState, useEffect, useCallback } from 'react';

export interface MesItem {
  mes: number;
  año: number;
  fecha: string;
}

export function generarMesesHistoricos(fechaCreacion: string): MesItem[] {
  const inicio = new Date(fechaCreacion);
  const ahora = new Date();
  const meses: MesItem[] = [];

  const temp = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
  const fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);

  while (temp <= fin) {
    meses.push({
      mes: temp.getMonth() + 1,
      año: temp.getFullYear(),
      fecha: temp.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }),
    });
    temp.setMonth(temp.getMonth() + 1);
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
