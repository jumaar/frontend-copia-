import React, { useState } from 'react';
import './UserHierarchy.css';

interface User {
  id: number;
  nombre_completo: string;
  celular: string;
  rol: string;
  activo: boolean;
  hijos?: User[];
}

interface UserHierarchyProps {
  users: User[];
  currentUserRole?: string;
  currentUserId?: string;
  onEditUser: (userId: number) => void;
  onToggleStatus: (userId: number, userName: string, currentStatus: boolean) => void;
  onDeleteUser: (userId: number, userName: string) => void;
}


const UserHierarchy: React.FC<UserHierarchyProps> = ({
  users,
  currentUserRole,
  currentUserId,
  onEditUser,
  onToggleStatus,
  onDeleteUser
}) => {
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set([currentUserId ? parseInt(currentUserId) : -1]));

  const toggleExpanded = (userId: number) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const renderUserWithChildren = (user: User, level: number = 0, isCurrentUser: boolean = false) => {
    const isExpanded = expandedUsers.has(user.id);
    const hasChildren = user.hijos && user.hijos.length > 0;
    const isSuperAdmin = currentUserRole === 'superadmin';

    return (
      <div key={user.id} className={`user-hierarchy-item level-${level} ${isCurrentUser ? 'current-user' : ''}`}>
        <div className="user-main-row">
          <div className="user-info">
            {hasChildren && (
              <button
                className="expand-button"
                onClick={() => toggleExpanded(user.id)}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
            {['frigorifico', 'tienda', 'logistica'].includes(user.rol) ? (
              <button className="user-role-button">{user.rol}</button>
            ) : (
              <span className="user-role">{user.rol}</span>
            )}
            <span className="user-name">
              {isCurrentUser ? `${user.nombre_completo} (Mi Perfil)` : user.nombre_completo}
            </span>
            <span className="user-phone">{user.celular}</span>
          </div>
          <div className="user-actions">
            <button className="action-button" onClick={() => onEditUser(user.id)}>Editar</button>
            {!isCurrentUser && (
              <>
                <button
                  className={`action-button ${user.activo ? 'delete' : 'activate'}`}
                  onClick={() => onToggleStatus(user.id, user.nombre_completo, user.activo)}
                >
                  {user.activo ? 'Desactivar' : 'Activar'}
                </button>
                {isSuperAdmin && (
                  <button
                    className="action-button danger"
                    onClick={() => onDeleteUser(user.id, user.nombre_completo)}
                  >
                    Eliminar
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="user-children">
            {user.hijos!.map(child => renderUserWithChildren(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (users.length === 0) {
    return <p>No hay usuarios para mostrar.</p>;
  }

  return (
    <div className="user-hierarchy">
      {users.map(user => renderUserWithChildren(user, 0, user.id.toString() === currentUserId))}
    </div>
  );
};

export default UserHierarchy;