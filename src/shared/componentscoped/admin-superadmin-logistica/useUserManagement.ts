import { useCallback } from 'react';
import { toggleUserStatus, deleteUser } from '../../../services/api';

export interface User {
  id: number;
  nombre_completo: string;
  celular: string;
  rol: string;
  activo: boolean;
  hijos?: User[];
  creadoPor?: string;
}

interface UseUserManagementOptions {
  currentUser: { id?: string; role?: string } | null;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export function useUserManagement({ currentUser, setUsers }: UseUserManagementOptions) {
  const handleToggleStatus = useCallback(async (userId: number, userName: string, currentStatus: boolean) => {
    const action = currentStatus ? 'desactivar' : 'activar';
    const isConfirmed = window.confirm(
      `¿Estás seguro de que quieres ${action} al usuario "${userName}"?`
    );

    if (isConfirmed) {
      try {
        const updatedUser = await toggleUserStatus(userId);
        const mappedUser: User = {
          id: updatedUser.id_usuario || updatedUser.id,
          nombre_completo: updatedUser.nombre_completo || `${updatedUser.nombre_usuario || ''} ${updatedUser.apellido_usuario || ''}`.trim(),
          celular: updatedUser.celular,
          rol: updatedUser.rol,
          activo: updatedUser.activo
        };

        setUsers(prevUsers => updateUserInHierarchy(prevUsers, userId, mappedUser));
      } catch (error) {
        console.error(`Error al cambiar el estado del usuario ${userId}.`);
        alert('No se pudo cambiar el estado del usuario. Inténtalo de nuevo.');
      }
    }
  }, [setUsers]);

  const handleUserUpdated = useCallback((updatedUser: any) => {
    setUsers(prevUsers => updateUserInHierarchy(prevUsers, updatedUser.id_usuario, {
      id: updatedUser.id_usuario,
      nombre_completo: `${updatedUser.nombre_usuario} ${updatedUser.apellido_usuario}`,
      celular: updatedUser.celular,
      rol: '',
      activo: true,
    }));
  }, [setUsers]);

  const handleDeleteUser = useCallback(async (userId: number, userName: string) => {
    if (userId.toString() === currentUser?.id) {
      alert('No puedes eliminar tu propio usuario.');
      return;
    }

    const isConfirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar al usuario "${userName}"? Esta acción no se puede deshacer.`
    );

    if (isConfirmed) {
      try {
        await deleteUser(userId);
        setUsers(prevUsers => removeUserFromHierarchy(prevUsers, userId));
        alert('Usuario eliminado exitosamente.');
      } catch (error: any) {
        console.error(`Error al eliminar el usuario ${userId}.`, error);
        const message = error.response?.data?.message || 'No se pudo eliminar el usuario. Inténtalo de nuevo.';
        alert(message);
      }
    }
  }, [currentUser, setUsers]);

  return { handleToggleStatus, handleUserUpdated, handleDeleteUser };
}

function updateUserInHierarchy(users: User[], targetId: number, updates: Partial<User>): User[] {
  return users.map(user => {
    if (user.id === targetId) return { ...user, ...updates };
    if (user.hijos) return { ...user, hijos: updateUserInHierarchy(user.hijos, targetId, updates) };
    return user;
  });
}

function removeUserFromHierarchy(users: User[], targetId: number): User[] {
  return users
    .filter(user => user.id !== targetId)
    .map(user => ({
      ...user,
      hijos: user.hijos ? removeUserFromHierarchy(user.hijos, targetId) : undefined,
    }));
}
