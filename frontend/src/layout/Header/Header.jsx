import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Header.scss";
import { removeUser } from "../../utils/localStorage";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    removeUser();
    navigate("/login");
    setShowMenu(false);
  };

  const isActive = (path) => location.pathname.includes(path);

  return (
    <nav className="navbar navbar-expand-lg header">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/default">
          <div className="brand-logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="4" width="10" height="10" rx="2" fill="#10a37f"/>
              <rect x="18" y="4" width="10" height="10" rx="2" fill="#10a37f" opacity="0.7"/>
              <rect x="4" y="18" width="10" height="10" rx="2" fill="#10a37f" opacity="0.7"/>
            </svg>
            <span className="brand-text">SkitSmith</span>
          </div>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded={showMenu}
          aria-label="Toggle navigation"
          onClick={() => setShowMenu(!showMenu)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div
          className={`collapse navbar-collapse ${showMenu ? "show" : ""}`}
          id="navbarNav"
        >
          <div className="navbar-nav ms-auto align-items-lg-center">
            <Link
              to="/default/bot-list"
              className={`nav-link ${isActive("/bot-list") ? "active" : ""}`}
              onClick={() => setShowMenu(false)}
            >
              <span className="nav-icon">🤖</span>
              My Bots
            </Link>

            <Link
              to="/default/chat"
              className={`nav-link ${isActive("/chat") && !isActive("/bot-list") ? "active" : ""}`}
              onClick={() => setShowMenu(false)}
            >
              <span className="nav-icon">💬</span>
              Chat
            </Link>

            <div className="nav-divider"></div>

            <button
              onClick={handleLogout}
              className="nav-link logout-btn"
              aria-label="Sign out"
            >
              <span className="nav-icon">🚪</span>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
