import React from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Dashboard = () => {
  const navigate = useNavigate();

  // Sample produits data from Produits component
  const produits = [
    { id: 1, nom: 'Produit A', categorie: 'Électronique', prixAchat: 199.99, prixVente: 299.99, stock: 50, alerteStock: 10, dateExpiration: '2025-12-31', image: null, description: 'Description du produit A' },
    { id: 2, nom: 'Produit B', categorie: 'Vêtements', prixAchat: 29.99, prixVente: 49.99, stock: 5, alerteStock: 20, dateExpiration: '2025-04-30', image: null, description: 'Description du produit B' },
  ];

  // Filter low stock products
  const lowStockProduits = produits.filter(produit => produit.stock <= produit.alerteStock);

  const handleLogout = () => {
    navigate('/');
  };

  const navigateTo = (path) => {
    navigate(`/${path}`);
  };

  const handleDownloadStats = () => {
    const doc = new jsPDF();

    // Define colors and fonts
    const primaryColor = [44, 44, 84]; // Dark blue for header
    const secondaryColor = [100, 100, 100]; // Gray for accents
    const textColor = [33, 37, 41]; // Dark gray for text

    // Add a header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F'); // Header background
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('Rapport de Statistiques', 20, 25);

    // Add logo (placeholder - replace with actual logo image)
    // doc.addImage(logoImage, 'PNG', 160, 10, 30, 20); // Uncomment and provide logoImage

    // Add subtitle and generation date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...textColor);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, 35);

    // Define statistics data
    const stats = [
      { category: 'Produits en Stock', value: '1245 unités', date: new Date().toISOString().split('T')[0] },
      { category: 'Ventes Totales', value: '56,890 DH', date: new Date().toISOString().split('T')[0] },
      { category: 'Ruptures de Stock', value: '12 produits', date: new Date().toISOString().split('T')[0] },
      { category: 'Clients Actifs', value: '320', date: new Date().toISOString().split('T')[0] },
      { category: 'Commandes en Cours', value: '45', date: new Date().toISOString().split('T')[0] },
    ];

    // Add table with enhanced styling
    autoTable(doc, {
      startY: 50,
      head: [['Catégorie', 'Valeur', 'Date']],
      body: stats.map((row) => [row.category, row.value, row.date]),
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 10,
        textColor: textColor,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245], // Light gray for alternate rows
      },
      margin: { top: 50 },
    });

    // Add a summary section
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Résumé', 20, finalY);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      [
        'Ce rapport présente un aperçu des performances actuelles du tableau de bord.',
        'Les données incluent le stock, les ventes, et les alertes de rupture.',
        'Contactez l\'administrateur pour plus de détails.',
      ],
      20,
      finalY + 10
    );

    // Add footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...secondaryColor);
      doc.text(
        `Page ${i} sur ${pageCount} | Généré par Zakaria Médicament`,
        20,
        doc.internal.pageSize.height - 10
      );
    }

    // Save the PDF
    doc.save(`dashboard-stats-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="container-fluid">
      {/* Inline CSS for animations */}
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateY(50px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          .card-animate {
            animation: slideIn 0.5s ease-out forwards;
          }
          .dashboard-cards .card-animate:nth-child(1) { animation-delay: 0.1s; }
          .dashboard-cards .card-animate:nth-child(2) { animation-delay: 0.2s; }
          .dashboard-cards .card-animate:nth-child(3) { animation-delay: 0.3s; }
          .activity-stock-cards .card-animate:nth-child(1) { animation-delay: 0.4s; }
          .activity-stock-cards .card-animate:nth-child(2) { animation-delay: 0.5s; }
          @media (prefers-reduced-motion: reduce) {
            .card-animate {
              animation: none;
            }
          }
        `}
      </style>
      <div className="row">
        {/* Sidebar Navigation */}
        <div
          className="col-md-3 col-lg-2 d-md-flex bg-dark text-white flex-column vh-100 p-0"
          style={{
            background: 'linear-gradient(180deg, #2c2c54 0%, #1b263b 100%)',
            boxShadow: '3px 0 10px rgba(0,0,0,0.2)',
          }}
        >
          <div
            className="p-3 border-bottom"
            style={{
              borderColor: 'rgba(255,255,255,0.1) !important',
              background: 'rgba(0,0,0,0.2)',
            }}
          >
            <h4 className="text-white mb-0 d-flex align-items-center">
              <i className="bi thal bi-grid me-2"></i> Menu Principal
            </h4>
          </div>
          <nav className="nav flex-column flex-grow-1 p-2">
            <button
              className="nav-link text-white text-start btn btn-link p-2 mb-1 rounded"
              onClick={() => navigateTo('dashboard')}
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
              <i className="bi bi-speedometer2 me-2"></i> Tableau de Bord
            </button>
            <button
              className="nav-link text-white text-start btn btn-link p-2 mb-1 rounded"
              onClick={() => navigateTo('produits')}
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
              <i className="bi bi-box-seam me-2"></i> Produits
            </button>
            <button
              className="nav-link text-white text-start btn btn-link p-2 mb-1 rounded"
              onClick={() => navigateTo('clients')}
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
              <i className="bi bi-people me-2"></i> Clients
            </button>
            <button
              className="nav-link text-white text-start btn btn-link p-2 mb-1 rounded"
              onClick={() => navigateTo('fournisseurs')}
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
              <i className="bi bi-truck me-2"></i> Fournisseurs
            </button>
            <button
              className="nav-link text-white text-start btn btn-link p-2 mb-1 rounded"
              onClick={() => navigateTo('commandes')}
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
              <i className="bi bi-cart me-2"></i> Commandes
            </button>
            <button
              className="nav-link text-white text-start btn btn-link p-2 mb-1 rounded"
              onClick={() => navigateTo('utilisateurs')}
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
                color: 'white',
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

        {/* Main Content Area with Animated Cards */}
        <main className="col-md-9 col-lg-10 ms-sm-auto px-md-4 py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Tableau de Bord</h1>
            <div className="d-flex align-items-center">
              <button
                onClick={handleDownloadStats}
                className="btn btn-primary me-3"
                style={{
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <i className="bi bi-download me-2"></i> Télécharger Statistiques
              </button>
              <div className="d-none d-md-block">
                <span className="text-muted">Bienvenue, Administrateur</span>
              </div>
            </div>
          </div>

          {/* Dashboard Cards with Animation */}
          <div className="row g-4 dashboard-cards">
            <div className="col-md-4">
              <div
                className="card h-100 border-0 shadow-sm card-animate"
                style={{
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px) scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
                }}
              >
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                      <i className="bi bi-box-seam text-primary fs-4"></i>
                    </div>
                    <div>
                      <h5 className="card-title mb-1">Produits</h5>
                      <p className="text-muted mb-0">1245 en stock</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div
                className="card h-100 border-0 shadow-sm card-animate"
                style={{
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px) scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
                }}
              >
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                      <i className="bi bi-currency-dollar text-success fs-4"></i>
                    </div>
                    <div>
                      <h5 className="card-title mb-1">Ventes</h5>
                      <p className="text-muted mb-0">56,890 DH</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div
                className="card h-100 border-0 shadow-sm card-animate"
                style={{
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px) scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
                }}
              >
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="bg-warning bg-opacity-10 p-3 rounded me-3">
                      <i className="bi bi-exclamation-triangle text-warning fs-4"></i>
                    </div>
                    <div>
                      <h5 className="card-title mb-1">Ruptures</h5>
                      <p className="text-muted mb-0">12 produits</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Alerts and Stock Status with Animation */}
          <div className="row mt-4 g-4 activity-stock-cards">
            <div className="col-lg-8">
              <div
                className="card border-0 shadow-sm card-animate"
                style={{
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px) scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
                }}
              >
                <div className="card-header bg-white">
                  <h5 className="mb-0">Alertes Produits</h5>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    {lowStockProduits.length === 0 ? (
                      <div className="list-group-item border-0 px-0 py-3">
                        <p className="text-muted mb-0">Aucune alerte pour le moment.</p>
                      </div>
                    ) : (
                      lowStockProduits.map((produit, index) => (
                        <div key={`low-${produit.id}`} className="list-group-item border-0 px-0 py-3">
                          <div className="d-flex align-items-center">
                            <div className="bg-light rounded p-2 me-3">
                              <i className="bi bi-exclamation-triangle text-danger"></i>
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between">
                                <h6 className="mb-1">Stock faible</h6>
                                <small className="text-muted">Aujourd'hui</small>
                              </div>
                              <p className="mb-0 text-muted">{produit.nom} - Stock: {produit.stock} (Seuil: {produit.alerteStock})</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div
                className="card border-0 shadow-sm h-100 card-animate"
                style={{
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px) scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
                }}
              >
                <div className="card-header bg-white">
                  <h5 className="mb-0">Statut du Stock</h5>
                </div>
                <div className="card-body">
                  <div className="text-center py-4">
                    <div
                      className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center"
                      style={{ width: '150px', height: '150px' }}
                    >
                      <div className="text-center">
                        <h3 className="mb-0">85%</h3>
                        <p className="text-muted mb-0">Disponible</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span>En stock</span>
                      <span>85%</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div className="progress-bar bg-success" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;