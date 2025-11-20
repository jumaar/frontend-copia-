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
  onSurtir?: (neveraId: number) => void;
}


const UserHierarchy: React.FC<UserHierarchyProps> = ({
  users,
  currentUserId,
  onEditUser,
  onToggleStatus,
  onDeleteUser,
  onSurtir
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
            ) : user.rol === 'tienda-fisica' ? (
              <span className="user-role">Tienda</span>
            ) : user.rol === 'nevera' ? (
              <span className="user-role">Nevera</span>
            ) : (
              <span className="user-role">{user.rol}</span>
            )}
            <span className="user-name">
              {isCurrentUser ? `${user.nombre_completo} (Mi Perfil)` : user.nombre_completo}
            </span>
            {user.rol === 'tienda-fisica' ? (
              <span className="user-address">📍 {user.celular}</span>
            ) : user.rol === 'nevera' ? (
              <span className="user-status">{user.activo ? '🟢 Activa' : '🔴 Inactiva'}</span>
            ) : isCurrentUser ? (
              <span className="user-phone">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="#25d366"
                  style={{ marginRight: '4px', verticalAlign: 'middle' }}
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                {user.celular}
              </span>
            ) : (
              <a
                href={`https://wa.me/57${user.celular}`}
                target="_blank"
                rel="noopener noreferrer"
                className="user-phone whatsapp-link"
                title={`Contactar por WhatsApp: ${user.celular}`}
                onClick={(e) => e.stopPropagation()}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="#25d366"
                  style={{ marginRight: '4px', verticalAlign: 'middle' }}
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                {user.celular}
              </a>
            )}
          </div>
          <div className="user-actions">
            {user.rol === 'tienda-fisica' ? null : user.rol === 'nevera' ? (
              onSurtir && <button className="action-button" onClick={() => onSurtir(Math.abs(user.id))}>Surtir</button>
            ) : isCurrentUser ? (
              <button className="action-button" onClick={() => onEditUser(user.id)}>Editar</button>
            ) : (
              <>
                {user.activo ? (
                  <>
                    <button className="action-button" onClick={() => onEditUser(user.id)}>Editar</button>
                    <button
                      className="action-button delete"
                      onClick={() => onToggleStatus(user.id, user.nombre_completo, user.activo)}
                    >
                      Desactivar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="action-button danger"
                      onClick={() => onDeleteUser(user.id, user.nombre_completo)}
                    >
                      Eliminar
                    </button>
                    <button
                      className="action-button activate"
                      onClick={() => onToggleStatus(user.id, user.nombre_completo, user.activo)}
                    >
                      Activar
                    </button>
                  </>
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