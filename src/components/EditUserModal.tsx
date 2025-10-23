import React, { useState, useEffect } from 'react';
import { updateUser } from '../services/api';
import './CreateTokenModal.css'; // Reutilizamos los estilos del otro modal

interface UserData {
  id_usuario: number;
  nombre_usuario: string;
  apellido_usuario: string;
  identificacion_usuario: string;
  celular: string;
  email: string;
  id_rol: number;
  fecha_creacion?: string;
  fecha_ultima_modifi?: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserData | null;
  onUserUpdated: (updatedUser: any) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, userData, onUserUpdated }) => {
  const [formData, setFormData] = useState<Partial<UserData>>({});
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
    }
  }, [userData]);

  if (!isOpen || !userData) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    // Validar formulario
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(" "));
      return;
    }

    // Filtrar solo los campos que han cambiado
    const changedFields: Record<string, any> = {};
    Object.keys(formData).forEach(key => {
      const formValue = formData[key as keyof UserData];
      const originalValue = userData[key as keyof UserData];
      if (formValue !== originalValue && formValue !== undefined && formValue !== '') {
        changedFields[key] = formValue;
      }
    });

    if (Object.keys(changedFields).length === 0) {
      setError("No se han realizado cambios.");
      return;
    }

    const isConfirmed = window.confirm(
      `¿Estás seguro de que quieres guardar los cambios para el usuario "${userData.nombre_usuario} ${userData.apellido_usuario}"?`
    );

    if (isConfirmed) {
      setIsLoading(true);
      setError(null);
      try {
        const updatedUser = await updateUser(userData.id_usuario, changedFields);
        onUserUpdated(updatedUser);
        onClose();
      } catch (err: any) {
        // Manejar errores específicos del backend
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError("No se pudieron guardar los cambios. Inténtalo de nuevo.");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Editar Usuario: {userData.nombre_usuario} {userData.apellido_usuario}</h2>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </header>
        <div className="modal-body">
          <form className="edit-user-form" id="edit-user-form" onSubmit={handleSubmit}>
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
          </form>
        </div>
        <footer className="modal-footer">
          <button type="button" className="button button-secondary" onClick={onClose} disabled={isLoading}>Cancelar</button>
          <button type="submit" form="edit-user-form" className="button button-primary" disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EditUserModal;