import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './UserInfo.css';

const UserInfo = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="user-info">
      <div className="user-avatar">
        {user.avatar ? (
          <img src={user.avatar} alt="Avatar" />
        ) : (
          <div className="avatar-placeholder">
            {user.first_name?.charAt(0) || user.username?.charAt(0) || 'U'}
          </div>
        )}
      </div>
      <div className="user-details">
        <div className="user-name">
          {user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}`
            : user.first_name || user.username
          }
        </div>
        <div className="user-role">
          {user.role || 'Usuario'}
        </div>
      </div>
    </div>
  );
};

export default UserInfo;