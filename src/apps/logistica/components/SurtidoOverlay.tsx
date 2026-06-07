import React from 'react';
import { useSurtido } from '../contexts/SurtidoContext';
import SurtirFlujoModal from './SurtirFlujoModal/SurtirFlujoModal';

const SurtidoOverlay: React.FC = () => {
  const { surtidoEnCurso, isModalOpen, finalizarSurtido } = useSurtido();

  if (!surtidoEnCurso) return null;

  return (
    <SurtirFlujoModal
      isOpen={isModalOpen}
      onClose={finalizarSurtido}
      idNevera={surtidoEnCurso.idNevera}
      nombreTienda={surtidoEnCurso.nombreTienda}
    />
  );
};

export default SurtidoOverlay;
