import React, { useState, useEffect } from 'react';
import { updateUserLogisticaComplete } from '../../../../services/api';
import './EditLogisticaModal.css';

interface UserLogisticaData {
  id_usuario: number;
  nombre_usuario: string;
  apellido_usuario: string;
  identificacion_usuario: string;
  celular: string;
  email: string;
  id_rol: number;
  fecha_creacion?: string;
  fecha_ultima_modifi?: string;
  logistica?: Array<{
    id_logistica: number;
    nombre_empresa: string;
    placa_vehiculo: string;
  }>;
  logisticas?: Array<{
    id_logistica: number;
    nombre_empresa: string;
    placa_vehiculo: string;
  }>;
}

interface EditLogisticaModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserLogisticaData | null;
  onUserUpdated: (updatedUser: any) => void;
}

const EditLogisticaModal: React.FC<EditLogisticaModalProps> = ({ 
  isOpen, 
  onClose, 
  userData, 
  onUserUpdated 
}) => {
  const [formData, setFormData] = useState<Partial<UserLogisticaData>>({});
  const [logisticaData, setLogisticaData] = useState({
    nombre_empresa: '',
    placa_vehiculo: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userData) {
      setFormData({
        nombre_usuario: userData.nombre_usuario,
        apellido_usuario: userData.apellido_usuario,
        identificacion_usuario: userData.identificacion_usuario,
        celular: userData.celular,
        email: userData.email,
      });

      // Inicializar datos de logística si existen
      if (userData.logisticas && userData.logisticas.length > 0) {
        setLogisticaData({
          nombre_empresa: userData.logisticas[0].nombre_empresa,
          placa_vehiculo: userData.logisticas[0].placa_vehiculo
        });
      } else if (userData.logistica && userData.logistica.length > 0) {
        setLogisticaData({
          nombre_empresa: userData.logistica[0].nombre_empresa,
          placa_vehiculo: userData.logistica[0].placa_vehiculo
        });
      } else {
        setLogisticaData({
          nombre_empresa: '',
          placa_vehiculo: ''
        });
      }
    }
    setError(null);
  }, [userData]);

  if (!isOpen || !userData) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleChangeLogistica = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'placa_vehiculo') {
      setLogisticaData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setLogisticaData(prev => ({ ...prev, [name]: value }));
    }
    setError(null);
  };

  const validateForm = () => {
    const errors: string[] = [];

    // Validar email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("El email no tiene un formato válido.");
    }

    // Validar celular (solo números, exactamente 10 dígitos)
    if (formData.celular && (!/^\d{10}$/.test(formData.celular))) {
      errors.push("El celular debe contener exactamente 10 números.");
    }

    // Validar identificación (solo números, al menos 6 dígitos)
    if (formData.identificacion_usuario && (!/^\d{6,}$/.test(formData.identificacion_usuario))) {
      errors.push("La identificación debe contener al menos 6 números.");
    }

    // Validar campos de logística obligatorios (siempre para este modal)
    if (!logisticaData.nombre_empresa.trim()) {
      errors.push("El nombre de la empresa es obligatorio para usuarios de logística.");
    }
    if (!logisticaData.placa_vehiculo.trim()) {
      errors.push("La placa del vehículo es obligatoria para usuarios de logística.");
    }

    return errors;
  };

  const handleSave = async () => {
    if (!userData || isLoading) return;

    // Validar formulario primero
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(" "));
      return;
    }

    // Verificar si hay cambios
    const changedFields: Record<string, any> = {};
    Object.keys(formData).forEach(key => {
      const formValue = formData[key as keyof UserLogisticaData];
      const originalValue = userData[key as keyof UserLogisticaData];
      if (formValue !== originalValue && formValue !== undefined && formValue !== '') {
        changedFields[key] = formValue;
      }
    });

    const hasLogisticaChanges =
      userData.logisticas?.[0]?.nombre_empresa !== logisticaData.nombre_empresa ||
      userData.logisticas?.[0]?.placa_vehiculo !== logisticaData.placa_vehiculo ||
      userData.logistica?.[0]?.nombre_empresa !== logisticaData.nombre_empresa ||
      userData.logistica?.[0]?.placa_vehiculo !== logisticaData.placa_vehiculo;

    if (Object.keys(changedFields).length === 0 && !hasLogisticaChanges) {
      onClose();
      return;
    }

    const isConfirmed = window.confirm(
      `¿Estás seguro de que quieres guardar los cambios para el usuario "${userData.nombre_usuario} ${userData.apellido_usuario}"?`
    );

    if (!isConfirmed) {
      return; // Si cancela, no hacer nada más
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const updatedUser = await updateUserLogisticaComplete(userData.id_usuario, {
        nombre_usuario: formData.nombre_usuario,
        apellido_usuario: formData.apellido_usuario,
        celular: formData.celular,
        nombre_empresa: logisticaData.nombre_empresa,
        placa_vehiculo: logisticaData.placa_vehiculo
      });

      onUserUpdated(updatedUser);
      onClose();
      
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("No se pudieron guardar los cambios. Inténtalo de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content modal-scrollable"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2>Editar Usuario: {userData.nombre_usuario} {userData.apellido_usuario}</h2>
        </header>
        <div className="modal-body modal-body-scrollable">
          <div className="edit-user-form">
            <div className="form-group">
              <label htmlFor="nombre_usuario">Nombre</label>
              <input type="text" id="nombre_usuario" name="nombre_usuario" value={formData.nombre_usuario || ''} onChange={handleChange} disabled={isLoading} />
            </div>
            <div className="form-group">
              <label htmlFor="apellido_usuario">Apellido</label>
              <input type="text" id="apellido_usuario" name="apellido_usuario" value={formData.apellido_usuario || ''} onChange={handleChange} disabled={isLoading} />
            </div>
            <div className="form-group">
              <label htmlFor="identificacion_usuario">Identificación</label>
              <input type="text" id="identificacion_usuario" name="identificacion_usuario" value={formData.identificacion_usuario || ''} onChange={handleChange} disabled={isLoading} />
            </div>
            <div className="form-group">
              <label htmlFor="celular">Celular</label>
              <input type="text" id="celular" name="celular" value={formData.celular || ''} onChange={handleChange} disabled={isLoading} />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" value={formData.email || ''} onChange={handleChange} disabled={isLoading} />
            </div>

            {/* Campos de logística - siempre visibles para este modal */}
            <div className="form-group-section">
              <h3>🏢 Datos de Empresa Logística</h3>
            </div>
            <div className="form-group">
              <label htmlFor="nombre_empresa">Nombre de la Empresa</label>
              <input 
                type="text" 
                id="nombre_empresa" 
                name="nombre_empresa" 
                value={logisticaData.nombre_empresa} 
                onChange={handleChangeLogistica} 
                disabled={isLoading}
                placeholder="Ej: Transportistas Frío S.A.S."
              />
            </div>
            <div className="form-group">
              <label htmlFor="placa_vehiculo">Placa del Vehículo</label>
              <input 
                type="text" 
                id="placa_vehiculo" 
                name="placa_vehiculo" 
                value={logisticaData.placa_vehiculo} 
                onChange={handleChangeLogistica} 
                disabled={isLoading}
                placeholder="Ej: ABC123"
              />
            </div>
            
            {userData?.fecha_creacion && (
              <div className="form-group">
                <label>Fecha de Creación</label>
                <span className="readonly-field">{new Date(userData.fecha_creacion).toLocaleString()}</span>
              </div>
            )}
            {userData?.fecha_ultima_modifi && (
              <div className="form-group">
                <label>Última Modificación</label>
                <span className="readonly-field">{new Date(userData.fecha_ultima_modifi).toLocaleString()}</span>
              </div>
            )}
            {error && <p className="modal-error">{error}</p>}
          </div>
        </div>
        <footer className="modal-footer">
          <button type="button" className="button button-secondary" onClick={onClose} disabled={isLoading}>Cancelar</button>
          <button 
            type="button" 
            className="button button-primary" 
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EditLogisticaModal;