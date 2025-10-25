import React, { useState, useEffect } from 'react';
import './CreateTokenModal.css'; // Reusing styles

export interface StationData {
  id?: string | number;
  name: string;
  address: string;
  city: string;
}

interface StationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationData?: StationData | null;
  onSave: (station: StationData) => void;
}

const mockCities = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena'];

const StationModal: React.FC<StationModalProps> = ({
  isOpen,
  onClose,
  stationData,
  onSave,
}) => {
  const [formData, setFormData] = useState<StationData>({
    name: '',
    address: '',
    city: mockCities,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!stationData;

  useEffect(() => {
    if (isOpen && stationData) {
      setFormData(stationData);
    } else if (isOpen) {
      setFormData({ name: '', address: '', city: mockCities });
    }
  }, [isOpen, stationData]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address) {
      setError('El nombre y la dirección son obligatorios.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      onSave({ ...formData, id: stationData?.id || `station-${Date.now()}` });
      onClose();
    } catch (err) {
      setError('No se pudo guardar la estación. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{isEditMode ? 'Editar' : 'Crear'} Estación de Producción</h2>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </header>
        <form id="station-form" onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="name">Nombre de la Estación</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="address">Dirección</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="city">Ciudad</label>
              <select
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                disabled={isLoading}
              >
                {mockCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            {error && <p className="modal-error">{error}</p>}
          </div>
          <footer className="modal-footer">
            <button type="button" className="button button-secondary" onClick={onClose} disabled={isLoading}>
              Cancelar
            </button>
            <button type="submit" className="button button-primary" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default StationModal;