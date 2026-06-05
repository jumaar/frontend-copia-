import React from 'react';
import './UserProfileCard.css';

interface UserProfileCardProps {
  role: string;
  fullName: string;
  phone: string;
  onEditClick: () => void;
  extraActions?: React.ReactNode;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  role,
  fullName,
  phone,
  onEditClick,
  extraActions,
}) => (
  <div className="user-profile-card">
    <div className="user-profile-info">
      <span className="user-profile-role">{role}</span>
      <span className="user-profile-name">{fullName} (Mi Perfil)</span>
      <span className="user-profile-phone">{phone}</span>
    </div>
    <div className="user-profile-actions">
      <button className="action-button" onClick={onEditClick}>Editar</button>
      {extraActions}
    </div>
  </div>
);

export type { UserProfileCardProps };
export default UserProfileCard;
