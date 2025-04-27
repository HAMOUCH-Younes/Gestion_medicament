import React from 'react';
import { useNavigate, Outlet } from 'react-router-dom';

const Layout = () => {
  const navigate = useNavigate();

  const navigateTo = (path) => {
    navigate(`/${path}`);
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar Navigation */}
        <div 
          className="col-md-3 col-lg-2 d-md-flex bg-dark text-white flex-column vh-100 p-0"
          style={{
            background: 'linear-gradient(180deg, #2c2c54 0%, #1b263b 100%)',
            boxShadow: '3px 0 10px rgba(0,0,0,0.2)'
          }}
        >
          <div 
            className="p-3 border-bottom"
            style={{
              borderColor: 'rgba(255,255,255,0.1) !important',
              background: 'rgba(0,0,0,0.2)'
            }}
          >
            <h4 className="text-white mb-0 d-flex align-items-center">
              <i className="bi bi-grid me-2"></i> Menu Principal
            </h4>
          </div>
          
          <nav className="nav flex-column flex-grow-1 p-2">
            <button 
              className="nav-link text-white text-start btn btn-link p-2 mb-1 rounded"
              onClick={() => navigateTo('dashboard')}
              style={{
                transition: 'all 0.3s ease',
                borderRadius: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <i className="bi bi-speedometer2 me-2"></i> Tableau de Bord
            </button>
            <button 
              className="nav-link text-white text-start btn btn-link p-2 mb-1 rounded"
              onClick={() => navigateTo('produits')}
              style={{
                transition: 'all 0.3s ease',
                borderRadius: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <i className="bi bi-box-seam me-2"></i> Produits
            </button>
            <button 
              className="nav-link text-white text-start btn btn-link p-2 mb-1 rounded"
              onClick={() => navigateTo('clients')}
              style={{
                transition: 'all 0.3s ease',
                borderRadius: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <i className="bi bi-people me-2"></i> Clients
            </button>
            <button 
              className="nav-link text-white text-start btn btn-link p-2 mb-1 rounded"
              onClick={() => navigateTo('fournisseurs')}
              style={{
                transition: 'all 0.3s ease',
                borderRadius: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <i className="bi bi-truck me-2"></i> Fournisseurs
            </button>
            <button 
              className="nav-link text-white text-start btn btn-link p-2 mb-1 rounded"
              onClick={() => navigateTo('commandes')}
              style={{
                transition: 'all 0.3s ease',
                borderRadius: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <i className="bi bi-cart me-2"></i> Commandes
            </button>
            <button 
              className="nav-link text-white text-start btn btn-link p-2 mb-1 rounded"
              onClick={() => navigateTo('utilisateurs')}
              style={{
                transition: 'all 0.3s ease',
                borderRadius: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <i className="bi bi-person-gear me-2"></i> Utilisateurs
            </button>
          </nav>

          <div 
            className="p-3 border-top mt-auto"
            style={{ borderColor: 'rgba(255,255,255,0.1) !important' }}
          >
            <button 
              onClick={handleLogout}
              className="btn btn-outline-light w-100"
              style={{
                transition: 'all 0.3s ease',
                background: 'linear-gradient(45deg, #dc3545, #c82333)',
                border: 'none',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.opacity = '1';
              }}
            >
              <i className="bi bi-box-arrow-left me-2"></i> Déconnexion
            </button>
          </div>
        </div>
        <div className="col-md-9 col-lg-10 p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;