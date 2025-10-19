import React from 'react';
import './ManagementPage.css';

// Mock data based on the seed file
const mockUsers = [
    { id: 1, name: 'juan juan', email: 'juanbitcoin988@gmail.com', role: 'Super_Admin', active: true },
    { id: 2, name: 'evaristo evaristo', email: 'hhhhh@mail.com', role: 'Frigorifico', active: true },
    { id: 3, name: 'hoffman hoffman', email: 'ggggg@mail.com', role: 'Admin', active: true },
    { id: 4, name: 'emanuel emanuel', email: 'sssss@mail.com', role: 'Logistica', active: true },
    { id: 5, name: 'oscar oscar', email: 'zzzzz@mail.com', role: 'Tienda', active: true },
];

const UserManagementPage: React.FC = () => {
  return (
    <div className="management-page">
      <header className="management-header">
        <h1>Gestión de Usuarios</h1>
        <p>Administrar todos los usuarios del sistema.</p>
        <button className="button button-primary">Crear Token de Registro</button>
      </header>

      <div className="management-table-container card">
        <table className="management-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {mockUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.active ? 'Activo' : 'Inactivo'}</td>
                <td>
                  <button className="action-button">Editar</button>
                  <button className="action-button delete">Desactivar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagementPage;