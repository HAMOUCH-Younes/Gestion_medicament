import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Layout = ({ children, currentUser, navigateTo, handleLogout }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Define navigation items with permissions
  const navItems = [
    { path: 'dashboard', icon: 'bi-speedometer2', label: 'Tableau de Bord', permission: 'dashboard' },
    { path: 'produits', icon: 'bi-box-seam', label: 'Produits', permission: 'produits' },
    { path: 'clients', icon: 'bi-people', label: 'Clients', permission: 'clients' },
    { path: 'fournisseurs', icon: 'bi-truck', label: 'Fournisseurs', permission: 'fournisseurs' },
    { path: 'commandes', icon: 'bi-cart', label: 'Commandes', permission: 'commandes' },
    { path: 'utilisateurs', icon: 'bi-person-gear', label: 'Utilisateurs', permission: 'utilisateurs' },
  ];

  return (
    <div className="container-fluid vh-100 overflow-hidden p-0 g-0">
      {/* Mobile Toggle Button */}
      <button
        className="d-md-none btn btn-primary position-fixed"
        style={{
          zIndex: 1100,
          top: '10px',
          left: '10px',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <i className={`bi fs-5 ${sidebarOpen ? 'bi-x' : 'bi-list'}`}></i>
      </button>

      <div className="row g-0 h-100 m-0">
        {/* Sidebar - Fixed width and height */}
        <div
          className={`bg-dark text-white flex-column h-100 p-0 position-fixed ${sidebarOpen ? 'd-flex' : 'd-none d-md-flex'}`}
          style={{
            background: 'linear-gradient(180deg, #2c2c54 0%, #1b263b 100%)',
            boxShadow: '3px 0 10px rgba(0,0,0,0.2)',
            zIndex: 1000,
            width: '250px',
            left: 0,
            top: 0,
          }}
        >
          <div
            className="p-3 border-bottom"
            style={{
              borderColor: 'rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.2)',
            }}
          >
            <h4 className="text-white mb-0 d-flex align-items-center">
              <i className="bi bi-grid me-2"></i> Menu Principal
            </h4>
          </div>

          <nav className="nav flex-column flex-grow-1 p-2">
            {navItems.map(
              ({ path, icon, label, permission }) =>
                currentUser?.permissions?.[permission] && (
                  <button
                    key={path}
                    className="nav-link text-white text-start btn btn-link p-2 mb-1 rounded"
                    onClick={() => {
                      navigateTo(path);
                      setSidebarOpen(false);
                    }}
                    style={{ transition: 'all 0.3s ease', borderRadius: '8px' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <i className={`bi ${icon} me-2`}></i> {label}
                  </button>
                )
            )}
          </nav>

          <div
            className="p-3 border-top mt-auto"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <button
              onClick={handleLogout}
              className="btn btn-outline-light w-100"
              style={{
                transition: 'all 0.3s ease',
                background: 'linear-gradient(45deg, #dc3545, #c82333)',
                border: 'none',
                color: 'white',
              }}
            >
              <i className="bi bi-box-arrow-left me-2"></i> Déconnexion
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div
          className="col p-4 overflow-auto h-100"
          style={{
            marginLeft: '250px',
            scrollBehavior: 'smooth',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;