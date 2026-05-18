import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon"></span>
          <span>RecMind</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className="nav-link">Discover</Link>
          {user ? (
            <>
              <span className="nav-user">Hi, {user.name}</span>
              <button onClick={handleLogout} className="nav-btn nav-btn-outline">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-btn nav-btn-outline">Login</Link>
              <Link to="/register" className="nav-btn nav-btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
