import React from 'react';
import './CoolButton.css'; // Ensure this is the path to your CSS file

interface CoolButtonProps {
  children: React.ReactNode;  // The content inside the button
  onClick?: () => void;       // Optional onClick handler
}

const CoolButton: React.FC<CoolButtonProps> = ({ children, onClick }) => {
  return (
    <button className="button-56" role="button" onClick={onClick}>
      {children}
    </button>
  );
};

export default CoolButton;
