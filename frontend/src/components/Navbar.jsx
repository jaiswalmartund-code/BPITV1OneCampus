import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo" style={{ textDecoration: 'none' }}></Link>
      <ul className="nav-links">
        {user ? (
          <>
            <li>
              <Link to="/dashboard" style={{ color: '#0a0a0aff' }}>Dashboard</Link>
            </li>
            <li>
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0b0b0bff',
                  fontWeight: 500,
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Logout ({user.name})
              </button>
            </li>
          </>
        ) : null}
      </ul>
    </nav>
  );
};

export default Navbar;
