import React from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomePage = () => {
  const navigate = useNavigate();

  const handleStartClick = () => {
    navigate('/login');
  };

  return (
    <div>
      {/* Hero Section */}
      <section
        className="d-flex align-items-center text-white position-relative"
        style={{
          backgroundImage: `url('./pharmacist-jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '100vh',
          backgroundColor: '#f0f0f0',
        }}
      >
        <div
          className="position-absolute top-0 start-0 bottom-0 bg-primary bg-opacity-50 rounded-end-circle"
          style={{ width: '50%' }}
        ></div>
        <div className="container position-relative z-1 ps-5">
          <h1 className="display-4 fw-bold mb-4">
            Système de Gestion de Stock de Médicaments
          </h1>
          <button 
            className="btn btn-primary btn-lg"
            onClick={handleStartClick}
          >
            Commencer
          </button>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-5" style={{ background: 'linear-gradient(to bottom, #e3f2fd, #bbdefb)' }}>
        <div className="container">
          <h2 className="text-center fw-bold mb-5">Pourquoi choisir notre système ?</h2>
          <div className="row row-cols-1 row-cols-md-3 g-4">
            {/* Card 1 */}
            <div className="col">
              <div className="card h-100 text-center shadow">
                <div className="card-body">
                  <div className="fs-1 mb-3">📦</div>
                  <h3 className="card-title fw-semibold">Gestion des stocks</h3>
                  <p className="card-text text-muted">
                    Suivez et gérez facilement vos stocks de médicaments en temps réel.
                  </p>
                </div>
              </div>
            </div>
            {/* Card 2 */}
            <div className="col">
              <div className="card h-100 text-center shadow">
                <div className="card-body">
                  <div className="fs-1 mb-3">👥</div>
                  <h3 className="card-title fw-semibold">
                    Gestion des Fournisseurs et Client
                  </h3>
                  <p className="card-text text-muted">
                    Suivez et gérez facilement vos Fournisseurs et client en temps réel.
                  </p>
                </div>
              </div>
            </div>
            {/* Card 3 */}
            <div className="col">
              <div className="card h-100 text-center shadow">
                <div className="card-body">
                  <div className="fs-1 mb-3">📊</div>
                  <h3 className="card-title fw-semibold">Rapports</h3>
                  <p className="card-text text-muted">
                    Des rapports détaillés pour analyser vos performances.
                  </p>
                </div>
              </div>
            </div>
            {/* Card 4 */}
            <div className="col">
              <div className="card h-100 text-center shadow">
                <div className="card-body">
                  <div className="fs-1 mb-3">🔒</div>
                  <h3 className="card-title fw-semibold">Sécurité</h3>
                  <p className="card-text text-muted">
                    Protégez les données de vos patients avec un système sécurisé.
                  </p>
                </div>
              </div>
            </div>
            {/* Card 5 */}
            <div className="col">
              <div className="card h-100 text-center shadow">
                <div className="card-body">
                  <div className="fs-1 mb-3">⏱️</div>
                  <h3 className="card-title fw-semibold">Gain de temps</h3>
                  <p className="card-text text-muted">
                    Automatisez vos processus et gagnez du temps sur le quotidien.
                  </p>
                </div>
              </div>
            </div>
            {/* Card 6 */}
            <div className="col">
              <div className="card h-100 text-center shadow">
                <div className="card-body">
                  <div className="fs-1 mb-3">📱</div>
                  <h3 className="card-title fw-semibold">Accessibilité</h3>
                  <p className="card-text text-muted">
                    Accédez à votre système de n'importe où, sur n'importe quel appareil.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-dark text-white py-5">
        <div className="container">
          <div className="row">
            {/* About */}
            <div className="col-md-4 mb-4">
              <h3 className="fw-semibold mb-3 text-white">À propos</h3>
              <p className="text-light">
                Système de gestion complète pour une gestion simplifiée.
              </p>
            </div>
            {/* Links */}
            <div className="col-md-4 mb-4">
              <h3 className="fw-semibold mb-3 text-white">Liens rapides</h3>
              <ul className="list-unstyled">
                <li><a href="#" className="text-light text-decoration-none">Accueil</a></li>
                <li><a href="#" className="text-light text-decoration-none">Fonctionnalités</a></li>
                <li><a href="#" className="text-light text-decoration-none">Contact</a></li>
              </ul>
            </div>
            {/* Contact */}
            <div className="col-md-4 mb-4">
              <h3 className="fw-semibold mb-3 text-white">Contact</h3>
              <p className="text-light">123 Rue Tiznit</p>
              <p className="text-light">zakariachouita@gmail.com</p>
              <p className="text-light">+212 6821-06782</p>
            </div>
          </div>
          <div className="text-center text-light mt-4">
            © 2025 Système de Gestion de Médicaments. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;