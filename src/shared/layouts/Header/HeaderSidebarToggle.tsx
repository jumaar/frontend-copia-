import React from 'react';

interface HeaderSidebarToggleProps {
  onToggle: () => void;
}

const HeaderSidebarToggle: React.FC<HeaderSidebarToggleProps> = ({ onToggle }) => (
  <button onClick={onToggle} className="sidebar-toggle-button">
    <span className="icon-bar"></span>
    <span className="icon-bar"></span>
    <span className="icon-bar"></span>
  </button>
);

export default HeaderSidebarToggle;
