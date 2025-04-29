import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Layout from '../Layout/Layout';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [produits, setProduits] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const apiUrl = 'http://localhost:8000/api';

  const api = axios.create({
    baseURL: apiUrl,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      Accept: 'application/json',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userResponse, produitsResponse, statsResponse] = await Promise.all([
          api.get('/user'),
          api.get('/produits'),
          api.get('/stats'),
        ]);
        setCurrentUser(userResponse.data);
        if (!userResponse.data.permissions?.dashboard) {
          navigate('/');
          return;
        }
        setProduits(produitsResponse.data);
        setStats(statsResponse.data);
        setErrorMessage('');
      } catch (error) {
        console.error('Error fetching data:', error.response || error);
        setErrorMessage('Échec du chargement des données. Veuillez réessayer.');
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const navigateTo = (path) => {
    navigate(`/${path}`);
  };

  const retryFetch = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      const [userResponse, produitsResponse, statsResponse] = await Promise.all([
        api.get('/user'),
        api.get('/produits'),
        api.get('/stats'),
      ]);
      setCurrentUser(userResponse.data);
      if (!userResponse.data.permissions?.dashboard) {
        navigate('/');
        return;
      }
      setProduits(produitsResponse.data);
      setStats(statsResponse.data);
      setErrorMessage('');
    } catch (error) {
      console.error('Retry failed:', error.response || error);
      setErrorMessage('Échec du rechargement. Veuillez vérifier votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  const lowStockProduits = produits.filter(produit => produit.stock <= produit.alerteStock);

  const handleDownloadStats = () => {
    const doc = new jsPDF();
    const primaryColor = [44, 44, 84];
    const textColor = [33, 37, 41];

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('Rapport de Statistiques', 20, 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...textColor);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, 35);

    const statsData = stats ? [
      { category: 'Produits en Stock', value: `${stats.totalStock} unités` },
      { category: 'Ventes Totales', value: `${stats.totalSales.toFixed(2)} DH` },
      { category: 'Ruptures de Stock', value: `${stats.lowStock} produits` },
      { category: 'Clients Actifs', value: stats.activeClients },
      { category: 'Commandes en Cours', value: stats.pendingOrders },
      { category: 'Disponibilité Stock', value: `${stats.stockAvailability.toFixed(2)}%` },
    ] : [];

    autoTable(doc, {
      startY: 50,
      head: [['Catégorie', 'Valeur']],
      body: statsData.map(row => [row.category, row.value]),
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 10,
        textColor,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: 50 },
    });

    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Résumé', 20, finalY);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      [
        'Ce rapport présente un aperçu des performances actuelles.',
        'Inclut stock, ventes, et alertes de rupture.',
        'Contactez l\'administrateur pour plus de détails.',
      ],
      20,
      finalY + 10
    );

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${i} sur ${pageCount} | Zakaria Médicament`, 20, doc.internal.pageSize.height - 10);
    }

    doc.save(`dashboard-stats-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const chartData = {
    labels: ['Stock', 'Ventes (x1000)', 'Ruptures', 'Clients', 'Commandes'],
    datasets: [
      {
        label: 'Statistiques',
        data: stats
          ? [stats.totalStock, stats.totalSales / 1000, stats.lowStock, stats.activeClients, stats.pendingOrders]
          : [0, 0, 0, 0, 0],
        backgroundColor: [
          'rgba(13, 110, 253, 0.7)',
          'rgba(25, 135, 84, 0.7)',
          'rgba(255, 193, 7, 0.7)',
          'rgba(111, 66, 193, 0.7)',
          'rgba(214, 51, 132, 0.7)'
        ],
        borderColor: [
          'rgba(13, 110, 253, 1)',
          'rgba(25, 135, 84, 1)',
          'rgba(255, 193, 7, 1)',
          'rgba(111, 66, 193, 1)',
          'rgba(214, 51, 132, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { 
        display: true, 
        text: 'Aperçu des Statistiques', 
        font: { 
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        padding: 10,
        cornerRadius: 5
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        title: { 
          display: true, 
          text: 'Valeur', 
          font: {
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: { 
        title: { 
          display: true, 
          text: 'Catégorie',
          font: {
            weight: 'bold'
          } 
        },
        grid: {
          display: false
        }
      },
    },
    maintainAspectRatio: false
  };

  if (loading) {
    return (
      <Layout>
        <main className="col-md-9 col-lg-10 ms-sm-auto px-md-4 py-4">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
            <div className="text-center">
              <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <h5 className="mt-3 text-muted">Chargement des données...</h5>
            </div>
          </div>
        </main>
      </Layout>
    );
  }

  if (!currentUser) return null;

  return (
    <Layout currentUser={currentUser} navigateTo={navigateTo} handleLogout={handleLogout}>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-slide-up {
          animation: slideUp 0.5s ease-out forwards;
        }
        .card-hover {
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1), 0 6px 6px rgba(0, 0, 0, 0.05) !important;
        }
        .stat-card {
          border-left: 4px solid;
          border-radius: 0.375rem;
        }
        .stat-card-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }
        .progress-thin {
          height: 6px;
        }
        .chart-container {
          height: 350px;
          position: relative;
        }
        .alert-item {
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }
        .alert-item:hover {
          background-color: rgba(248, 249, 250, 0.8);
          border-left-color: var(--bs-danger);
        }
        .availability-circle {
          width: 140px;
          height: 140px;
          border: 8px solid #f0f0f0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          position: relative;
        }
        .availability-circle::before {
          content: '';
          position: absolute;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background-color: white;
        }
        .availability-content {
          position: relative;
          z-index: 1;
        }
      `}</style>
      
      <main >
        
        {errorMessage && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center mb-4 animate-fade-in">
            <div className="d-flex align-items-center">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <span>{errorMessage}</span>
            </div>
            <button onClick={retryFetch} className="btn btn-sm btn-outline-danger">
              <i className="bi bi-arrow-clockwise me-1"></i> Réessayer
            </button>
          </div>
        )}

        
        <div className="d-flex justify-content-between flex-wrap align-items-center mb-4">
          <div>
            <h1 className="h2 fw-bold mb-1">Tableau de Bord</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item active" aria-current="page">Accueil</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex align-items-center mt-2 mt-md-0">
            <button
              onClick={handleDownloadStats}
              className="btn btn-primary me-3 d-flex align-items-center"
            >
              <i className="bi bi-file-earmark-pdf me-2"></i> Exporter PDF
            </button>
            <div className="d-flex align-items-center">
              <div className="me-2 text-end d-none d-md-block">
                <h6 className="mb-0 fw-semibold">{currentUser.name || 'Administrateur'}</h6>
                <small className="text-muted">Connecté</small>
              </div>
              <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                <i className="bi bi-person-circle text-primary"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="row row-cols-1 row-cols-md-3 g-4 mb-4">
          {[
            { 
              title: 'Produits', 
              value: stats?.totalStock || 0, 
              unit: 'en stock', 
              icon: 'bi-box-seam', 
              color: 'primary',
              borderColor: 'border-primary'
            },
            { 
              title: 'Ventes', 
              value: stats?.totalSales?.toFixed(2) || 0, 
              unit: 'DH', 
              icon: 'bi-currency-dollar', 
              color: 'success',
              borderColor: 'border-success'
            },
            { 
              title: 'Ruptures', 
              value: stats?.lowStock || 0, 
              unit: 'produits', 
              icon: 'bi-exclamation-triangle', 
              color: 'warning',
              borderColor: 'border-warning'
            },
          ].map((card, index) => (
            <div key={index} className="col">
              <div
                className={`card h-100 shadow-sm card-hover animate-slide-up stat-card ${card.borderColor}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className={`stat-card-icon bg-${card.color}-subtle me-3`}>
                      <i className={`bi ${card.icon} text-${card.color} fs-4`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="text-muted text-uppercase fs-7 fw-semibold mb-1">{card.title}</h6>
                      <h3 className="mb-0 fw-bold">{card.value}</h3>
                      <small className="text-muted">{card.unit}</small>
                    </div>
                    <div className="ms-auto">
                      <div className={`bg-${card.color}-subtle rounded p-2`}>
                        <i className={`bi bi-arrow-up text-${card.color}`}></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm h-100 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-semibold">Alertes de Stock</h5>
                  <span className="badge bg-danger">{lowStockProduits.length}</span>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="list-group list-group-flush">
                  {lowStockProduits.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-check-circle-fill text-success fs-1"></i>
                      <h5 className="mt-3 fw-semibold">Aucune alerte</h5>
                      <p className="text-muted">Tous les produits sont bien approvisionnés</p>
                    </div>
                  ) : (
                    lowStockProduits.map((produit, idx) => (
                      <div
                        key={`low-${produit.id}`}
                        className="list-group-item alert-item py-3 px-4"
                      >
                        <div className="d-flex align-items-center">
                          <div className="bg-danger bg-opacity-10 p-2 rounded me-3">
                            <i className="bi bi-exclamation-triangle text-danger"></i>
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-center">
                              <h6 className="mb-0 fw-semibold">{produit.nom}</h6>
                              <span className="badge bg-danger">Urgent</span>
                            </div>
                            <div className="d-flex justify-content-between mt-2">
                              <small className="text-muted">
                                Stock actuel: <span className="fw-semibold">{produit.stock}</span>
                              </small>
                              <small className="text-muted">
                                Seuil: <span className="fw-semibold">{produit.alerteStock}</span>
                              </small>
                            </div>
                            <div className="progress progress-thin mt-2">
                              <div
                                className="progress-bar bg-danger"
                                role="progressbar"
                                style={{ width: `${(produit.stock / produit.alerteStock) * 100}%` }}
                                aria-valuenow={produit.stock}
                                aria-valuemin="0"
                                aria-valuemax={produit.alerteStock}
                              ></div>
                            </div>
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
            <div className="card border-0 shadow-sm h-100 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="card-header bg-white border-0 py-3">
                <h5 className="mb-0 fw-semibold">Disponibilité du Stock</h5>
              </div>
              <div className="card-body text-center">
                <div className="availability-circle mb-4">
                  <div className="availability-content">
                    <h3 className="mb-0 fw-bold">{stats?.stockAvailability?.toFixed(2) || 0}%</h3>
                    <p className="text-muted mb-0">Disponible</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Niveau actuel</span>
                    <span className="fw-semibold">{stats?.stockAvailability?.toFixed(2) || 0}%</span>
                  </div>
                  <div className="progress progress-thin">
                    <div
                      className="progress-bar bg-primary"
                      role="progressbar"
                      style={{ width: `${stats?.stockAvailability || 0}%` }}
                      aria-valuenow={stats?.stockAvailability || 0}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                  <div className="mt-3 d-flex justify-content-between">
                    <small className="text-muted">0%</small>
                    <small className="text-muted">100%</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm mt-4 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="card-header bg-white border-0 py-3">
            <h5 className="mb-0 fw-semibold">Analyse des Statistiques</h5>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Dashboard;