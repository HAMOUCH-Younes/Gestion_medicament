import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import Layout from '../Layout/Layout';

const Commandes = () => {
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [commandes, setCommandes] = useState([]);
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [newCommande, setNewCommande] = useState({
    client_id: '',
    date: '',
    status: 'En cours',
    payment_status: 'En cours',
    produits: [],
  });
  const [editCommande, setEditCommande] = useState(null);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [newProduit, setNewProduit] = useState({
    produit_id: '',
    prix: '',
    quantite: 1,
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const apiUrl = 'http://localhost:8000/api';

  const api = axios.create({
    baseURL: apiUrl,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userResponse = await api.get('/user');
        const user = userResponse.data;
        setCurrentUser(user);

        if (!user.permissions.commandes) {
          navigate('/dashboard');
          return;
        }

        const [commandesResponse, clientsResponse, produitsResponse] = await Promise.all([
          api.get('/commandes'),
          api.get('/clients'),
          api.get('/produits'),
        ]);

        setCommandes(commandesResponse.data);
        setClients(clientsResponse.data);
        setProduits(produitsResponse.data);
        setErrorMessage('');
      } catch (error) {
        console.error('Error fetching data:', error.response || error);
        setErrorMessage('Failed to load data: ' + (error.response?.data?.message || error.message));
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

  const navigateTo = (path) => {
    navigate(`/${path}`);
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
      localStorage.removeItem('token');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error.response || error);
      localStorage.removeItem('token');
      navigate('/');
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleFilterDateChange = (e) => {
    setFilterDate(e.target.value);
  };

  const handleCommandeInputChange = (e) => {
    const { name, value } = e.target;
    setNewCommande(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditCommandeInputChange = (e) => {
    const { name, value } = e.target;
    setEditCommande(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProduitInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'produit_id') {
      const selectedProduct = produits.find(p => p.id === parseInt(value));
      setNewProduit(prev => ({
        ...prev,
        produit_id: value,
        prix: selectedProduct ? parseFloat(selectedProduct.prix) : '',
      }));
    } else {
      setNewProduit(prev => ({
        ...prev,
        [name]: name === 'quantite' ? parseInt(value) || 1 : value,
      }));
    }
  };

  const handleAddProduit = (isEdit = false) => {
    if (newProduit.produit_id && newProduit.prix && newProduit.quantite > 0) {
      const selectedProduct = produits.find(p => p.id === parseInt(newProduit.produit_id));
      if (!selectedProduct) {
        setErrorMessage('Produit sélectionné non trouvé.');
        return;
      }
      const produit = {
        produit_id: parseInt(newProduit.produit_id),
        prix: parseFloat(newProduit.prix),
        quantite: newProduit.quantite,
      };
      if (isEdit) {
        setEditCommande(prev => ({
          ...prev,
          produits: [...prev.produits, produit],
        }));
      } else {
        setNewCommande(prev => ({
          ...prev,
          produits: [...prev.produits, produit],
        }));
      }
      setNewProduit({
        produit_id: '',
        prix: '',
        quantite: 1,
      });
    } else {
      setErrorMessage('Veuillez sélectionner un produit valide avec un prix et une quantité.');
    }
  };

  const handleRemoveProduit = (index, isEdit = false) => {
    if (isEdit) {
      setEditCommande(prev => ({
        ...prev,
        produits: prev.produits.filter((_, i) => i !== index),
      }));
    } else {
      setNewCommande(prev => ({
        ...prev,
        produits: prev.produits.filter((_, i) => i !== index),
      }));
    }
  };

  const calculateTotal = (produits) => {
    return produits.reduce((sum, produit) => sum + (produit.prix * produit.quantite), 0).toFixed(2);
  };

  const handleAddCommande = async (e) => {
    e.preventDefault();
    if (newCommande.client_id && newCommande.date && newCommande.produits.length > 0) {
      try {
        const response = await api.post('/commandes', newCommande);
        setCommandes(prev => [...prev, response.data]);
        setNewCommande({
          client_id: '',
          date: '',
          status: 'En cours',
          payment_status: 'En cours',
          produits: [],
        });
        setNewProduit({
          produit_id: '',
          prix: '',
          quantite: 1,
        });
        setShowPopup(false);
        setErrorMessage('');
      } catch (error) {
        console.error('Error adding commande:', error.response || error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
        if (error.response?.status === 422) {
          const errors = error.response.data.errors;
          setErrorMessage('Validation errors: ' + Object.values(errors).flat().join(' '));
        } else if (error.response?.status === 403) {
          setErrorMessage('Unauthorized: You must be an Admin to add commands.');
        } else {
          setErrorMessage('Failed to add commande: ' + (error.response?.data?.message || 'Unknown error'));
        }
      }
    } else {
      setErrorMessage('Veuillez remplir tous les champs requis et ajouter au moins un produit.');
    }
  };

  const handleEditClick = (e, commande) => {
    e.stopPropagation();
    const client = clients.find(c => c.nom === commande.client);
    const produitsMapped = commande.produits.map(p => ({
      produit_id: p.produit_id,
      prix: parseFloat(p.prix) || 0,
      quantite: p.quantite,
    }));
    setEditCommande({
      id: commande.id,
      client_id: client ? client.id : '',
      date: commande.date,
      status: commande.status,
      payment_status: commande.paymentStatus,
      produits: produitsMapped,
    });
    setShowEditPopup(true);
  };

  const handleEditCommande = async (e) => {
    e.preventDefault();
    if (editCommande.client_id && editCommande.date && editCommande.produits.length > 0) {
      try {
        const response = await api.put(`/commandes/${editCommande.id}`, editCommande);
        console.log('Backend response:', response.data);
        const updatedCommande = {
          ...response.data,
          client: typeof response.data.client === 'string'
            ? response.data.client
            : response.data.client?.nom || 'Unknown Client',
        };
        setCommandes(prev => prev.map(commande =>
          commande.id === editCommande.id ? updatedCommande : commande
        ));
        setEditCommande(null);
        setNewProduit({
          produit_id: '',
          prix: '',
          quantite: 1,
        });
        setShowEditPopup(false);
        setErrorMessage('');
      } catch (error) {
        console.error('Error updating commande:', error.response || error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
        if (error.response?.status === 422) {
          const errors = error.response.data.errors;
          setErrorMessage('Validation errors: ' + Object.values(errors).flat().join(' '));
        } else if (error.response?.status === 403) {
          setErrorMessage('Unauthorized: You must be an Admin to update commands.');
        } else {
          setErrorMessage('Failed to update commande: ' + (error.response?.data?.message || 'Unknown error'));
        }
      }
    } else {
      setErrorMessage('Veuillez remplir tous les champs requis et ajouter au moins un produit.');
    }
  };

  const handleDeleteClick = async (e, commandeId) => {
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      try {
        await api.delete(`/commandes/${commandeId}`);
        setCommandes(prev => prev.filter(commande => commande.id !== commandeId));
        setErrorMessage('');
      } catch (error) {
        console.error('Error deleting commande:', error.response || error);
        setErrorMessage('Failed to delete commande: ' + (error.response?.data?.message || 'Unknown error'));
      }
    }
  };

  const handleCommandeClick = (commande) => {
    setSelectedCommande(commande);
    setShowDetailPopup(true);
  };

  const handleDownloadBonCommande = (commande) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    let yPosition = margin;

    const checkPageBreak = (requiredSpace) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        addHeader();
        addFooter();
      }
    };

    const addHeader = () => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("[Zakaria Medicament Logo]", margin, yPosition);
      yPosition += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Zakaria Medicament", margin, yPosition);
      yPosition += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("123 Business Street, Tiznit, Morocco", margin, yPosition);
      yPosition += 5;
      doc.text("Phone: +212 682-106782 | Email: contact@gmail.com", margin, yPosition);
      yPosition += 10;
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Bon de Commande", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;
      doc.setLineWidth(0.5);
      doc.setDrawColor(100, 100, 100);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
    };

    const addFooter = () => {
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150);
      doc.text(
        "Generated by Zakaria Medicament | All rights reserved",
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
      doc.setTextColor(0, 0, 0);
    };

    addHeader();
    addFooter();

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Détails de la Commande", margin, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Commande ID: ${commande.id}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Client: ${commande.client}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Créée par: ${commande.user || 'Unknown'}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Date: ${commande.date}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Statut: ${commande.status}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Statut de Paiement: ${commande.paymentStatus}`, margin, yPosition);
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Produits", margin, yPosition);
    yPosition += 8;

    const tableX = margin;
    const colWidths = [80, 30, 30, 40];
    const tableHeaders = ["Nom du Produit", "Prix (DH)", "Quantité", "Total (DH)"];
    doc.setFontSize(10);
    doc.setFillColor(220, 220, 220);
    doc.rect(tableX, yPosition - 5, colWidths.reduce((a, b) => a + b, 0), 8, "F");
    tableHeaders.forEach((header, i) => {
      doc.setFont("helvetica", "bold");
      doc.text(
        header,
        tableX + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 2,
        yPosition
      );
    });
    yPosition += 8;

    commande.produits.forEach((produit, index) => {
      checkPageBreak(10);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(tableX, yPosition - 5, colWidths.reduce((a, b) => a + b, 0), 8, "F");
      }
      const maxNameLength = 40;
      const displayName =
        produit.nomProduit.length > maxNameLength
          ? produit.nomProduit.substring(0, maxNameLength - 3) + "..."
          : produit.nomProduit;
      doc.text(displayName, tableX + 2, yPosition);
      doc.text(produit.prix.toFixed(2), tableX + colWidths[0] + 2, yPosition);
      doc.text(
        produit.quantite.toString(),
        tableX + colWidths[0] + colWidths[1] + 2,
        yPosition
      );
      doc.text(
        (produit.prix * produit.quantite).toFixed(2),
        tableX + colWidths[0] + colWidths[1] + colWidths[2] + 2,
        yPosition
      );
      doc.setLineWidth(0.2);
      doc.rect(tableX, yPosition - 5, colWidths.reduce((a, b) => a + b, 0), 8);
      yPosition += 8;
    });

    doc.setLineWidth(0.5);
    doc.rect(
      tableX,
      yPosition - commande.produits.length * 8 - 13,
      colWidths.reduce((a, b) => a + b, 0),
      commande.produits.length * 8 + 13
    );

    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Total: ${calculateTotal(commande.produits)} DH`,
      pageWidth - margin,
      yPosition,
      { align: "right" }
    );
    yPosition += 20;
    checkPageBreak(20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text(
      "Thank you for your business!",
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );
    doc.setTextColor(0, 0, 0);
    doc.save(`Bon_de_Commande_${commande.id}.pdf`);
  };

  const handleDownloadAllCommandes = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPosition = margin;

    const addHeader = () => {
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Liste de Toutes les Commandes", margin, yPosition);
      yPosition += 10;
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, 190, yPosition);
      yPosition += 10;
    };

    const checkPageBreak = (requiredSpace) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        addHeader();
      }
    };

    if (commandes.length === 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Aucune commande à afficher", margin, yPosition);
      doc.save("Toutes_les_Commandes.pdf");
      return;
    }

    addHeader();

    commandes.forEach((commande, index) => {
      checkPageBreak(70);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Commande ${index + 1}`, margin, yPosition);
      yPosition += 8;
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`ID: ${commande.id}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Client: ${commande.client}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Créée par: ${commande.user || 'Unknown'}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Date: ${commande.date}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Statut: ${commande.status}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Statut de Paiement: ${commande.paymentStatus}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Total: ${calculateTotal(commande.produits)} DH`, margin, yPosition);
      yPosition += 8;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Produits:", margin, yPosition);
      yPosition += 8;

      const tableX = margin;
      const colWidths = [60, 40, 30, 40];
      const tableHeaders = ["Nom", "Prix (DH)", "Quantité", "Total (DH)"];
      doc.setFontSize(10);
      doc.setFillColor(200, 200, 200);
      doc.rect(tableX, yPosition - 5, colWidths.reduce((a, b) => a + b, 0), 8, "F");
      tableHeaders.forEach((header, i) => {
        doc.text(
          header,
          tableX + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 2,
          yPosition
        );
      });
      yPosition += 8;

      commande.produits.forEach((produit, prodIndex) => {
        checkPageBreak(10);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        if (prodIndex % 2 === 0) {
          doc.setFillColor(240, 240, 240);
          doc.rect(tableX, yPosition - 5, colWidths.reduce((a, b) => a + b, 0), 8, "F");
        }
        const maxNameLength = 30;
        const displayName = produit.nomProduit.length > maxNameLength
          ? produit.nomProduit.substring(0, maxNameLength - 3) + "..."
          : produit.nomProduit;
        doc.text(displayName, tableX + 2, yPosition);
        doc.text(produit.prix.toFixed(2), tableX + colWidths[0] + 2, yPosition);
        doc.text(produit.quantite.toString(), tableX + colWidths[0] + colWidths[1] + 2, yPosition);
        doc.text(
          (produit.prix * produit.quantite).toFixed(2),
          tableX + colWidths[0] + colWidths[1] + colWidths[2] + 2,
          yPosition
        );
        doc.setLineWidth(0.2);
        doc.rect(tableX, yPosition - 5, colWidths.reduce((a, b) => a + b, 0), 8);
        yPosition += 8;
      });

      doc.setLineWidth(0.5);
      doc.rect(
        tableX,
        yPosition - commande.produits.length * 8 - 13,
        colWidths.reduce((a, b) => a + b, 0),
        commande.produits.length * 8 + 13
      );
      yPosition += 10;
    });

    doc.save("Toutes_les_Commandes.pdf");
  };

  const filteredCommandes = commandes.filter((commande) => {
    const clientName = typeof commande.client === 'string'
      ? commande.client
      : commande.client?.nom || 'Unknown Client';
    const matchesClient = clientName.toLowerCase().includes(search.toLowerCase());
    const matchesDate = filterDate ? commande.date === filterDate : true;
    return matchesClient && matchesDate;
  });

  if (loading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <Layout currentUser={currentUser} navigateTo={navigateTo} handleLogout={handleLogout}>
      <div className="container-fluid p-4">
        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        )}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Commandes</h1>
          <div>
            {currentUser.role !== 'User' && (
              <button
                className="btn btn-primary me-2"
                onClick={() => setShowPopup(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>Ajouter Commande
              </button>
            )}
            <button
              className="btn btn-success"
              onClick={handleDownloadAllCommandes}
              disabled={commandes.length === 0}
            >
              <i className="bi bi-download me-2"></i>Télécharger Toutes
            </button>
          </div>
        </div>
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-end mb-3 flex-wrap">
              <div className="me-3 mb-2">
                <input
                  type="text"
                  className="form-control"
                  style={{ maxWidth: '300px' }}
                  placeholder="Rechercher par client..."
                  value={search}
                  onChange={handleSearch}
                />
              </div>
              <div className="mb-2">
                <input
                  type="date"
                  className="form-control"
                  style={{ maxWidth: '200px' }}
                  placeholder="Filtrer par date"
                  value={filterDate}
                  onChange={handleFilterDateChange}
                />
              </div>
            </div>
            <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table className="table table-hover align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Client</th>
                    <th>Créée par</th>
                    <th>Date</th>
                    <th>Total (DH)</th>
                    <th>Statut</th>
                    <th>Statut de Paiement</th>
                    <th style={{ minWidth: '220px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCommandes.length > 0 ? (
                    filteredCommandes.map((commande) => (
                      <tr key={commande.id}>
                        <td onClick={() => handleCommandeClick(commande)} style={{ cursor: 'pointer' }}>{commande.id}</td>
                        <td onClick={() => handleCommandeClick(commande)} style={{ cursor: 'pointer' }}>{commande.client}</td>
                        <td onClick={() => handleCommandeClick(commande)} style={{ cursor: 'pointer' }}>{commande.user || 'Unknown'}</td>
                        <td onClick={() => handleCommandeClick(commande)} style={{ cursor: 'pointer' }}>{commande.date}</td>
                        <td onClick={() => handleCommandeClick(commande)} style={{ cursor: 'pointer' }}>{calculateTotal(commande.produits)}</td>
                        <td onClick={() => handleCommandeClick(commande)} style={{ cursor: 'pointer' }}>{commande.status}</td>
                        <td onClick={() => handleCommandeClick(commande)} style={{ cursor: 'pointer' }}>{commande.paymentStatus}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {currentUser.role !== 'User' && (
                            <>
                              <button
                                className="btn btn-primary me-2"
                                onClick={(e) => handleEditClick(e, commande)}
                              >
                                <i className="bi bi-pencil"></i> Éditer
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={(e) => handleDeleteClick(e, commande.id)}
                              >
                                <i className="bi bi-trash"></i> Supprimer
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center">
                        Aucune commande trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showPopup && (
          <div
            className="modal d-block"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowPopup(false)}
          >
            <div
              className="modal-dialog modal-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Ajouter une Nouvelle Commande</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowPopup(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  {errorMessage && (
                    <div className="alert alert-danger" role="alert">
                      {errorMessage}
                    </div>
                  )}
                  <form onPhysicsInfoSubmit={handleAddCommande}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Client</label>
                        <select
                          className="form-control"
                          name="client_id"
                          value={newCommande.client_id}
                          onChange={handleCommandeInputChange}
                          required
                        >
                          <option value="">Sélectionner un client</option>
                          {clients.map(client => (
                            <option key={client.id} value={client.id}>{client.nom}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Date</label>
                        <input
                          type="date"
                          className="form-control"
                          name="date"
                          value={newCommande.date}
                          onChange={handleCommandeInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Statut</label>
                        <select
                          className="form-control"
                          name="status"
                          value={newCommande.status}
                          onChange={handleCommandeInputChange}
                          required
                        >
                          <option value="En cours">En cours</option>
                          <option value="Livré">Livré</option>
                          <option value="Annulé">Annulé</option>
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Statut de Paiement</label>
                        <select
                          className="form-control"
                          name="payment_status"
                          value={newCommande.payment_status}
                          onChange={handleCommandeInputChange}
                          required
                        >
                          <option value="En cours">En cours</option>
                          <option value="Payé">Payé</option>
                          <option value="Annulé">Annulé</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <h6>Ajouter un Produit</h6>
                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Produit</label>
                          <select
                            className="form-control"
                            name="produit_id"
                            value={newProduit.produit_id}
                            onChange={handleProduitInputChange}
                          >
                            <option value="">Sélectionner un produit</option>
                            {produits.map(produit => (
                              <option key={produit.id} value={produit.id}>{produit.nomProduit}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label">Prix (DH)</label>
                          <input
                            type="number"
                            className="form-control"
                            name="prix"
                            value={newProduit.prix}
                            onChange={handleProduitInputChange}
                            step="0.01"
                          />
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label">Quantité</label>
                          <input
                            type="number"
                            className="form-control"
                            name="quantite"
                            value={newProduit.quantite}
                            onChange={handleProduitInputChange}
                            min="1"
                          />
                        </div>
                        <div className="col-md-2 mb-3 d-flex align-items-end">
                          <button
                            type="button"
                            className="btn btn-primary w-100"
                            onClick={() => handleAddProduit()}
                          >
                            <i className="bi bi-plus-circle"></i>
                          </button>
                        </div>
                      </div>
                      {newCommande.produits.length > 0 && (
                        <div className="mt-3">
                          <h6>Produits Sélectionnés</h6>
                          <table className="table table-sm">
                            <thead>
                              <tr>
                                <th>Nom</th>
                                <th>Prix (DH)</th>
                                <th>Quantité</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {newCommande.produits.map((produit, index) => (
                                <tr key={index}>
                                  <td>{produits.find(p => p.id === produit.produit_id)?.nomProduit || 'Produit inconnu'}</td>
                                  <td>{produit.prix.toFixed(2)}</td>
                                  <td>{produit.quantite}</td>
                                  <td>
                                    <button
                                      type="button"
                                      className="btn btn-danger btn-sm"
                                      onClick={() => handleRemoveProduit(index)}
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowPopup(false)}
                      >
                        Annuler
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Ajouter Commande
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEditPopup && editCommande && (
          <div
            className="modal d-block"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowEditPopup(false)}
          >
            <div
              className="modal-dialog modal-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Modifier la Commande: {editCommande.id}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowEditPopup(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  {errorMessage && (
                    <div className="alert alert-danger" role="alert">
                      {errorMessage}
                    </div>
                  )}
                  <form onSubmit={handleEditCommande}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Client</label>
                        <select
                          className="form-control"
                          name="client_id"
                          value={editCommande.client_id}
                          onChange={handleEditCommandeInputChange}
                          required
                        >
                          <option value="">Sélectionner un client</option>
                          {clients.map(client => (
                            <option key={client.id} value={client.id}>{client.nom}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Date</label>
                        <input
                          type="date"
                          className="form-control"
                          name="date"
                          value={editCommande.date}
                          onChange={handleEditCommandeInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Statut</label>
                        <select
                          className="form-control"
                          name="status"
                          value={editCommande.status}
                          onChange={handleEditCommandeInputChange}
                          required
                        >
                          <option value="En cours">En cours</option>
                          <option value="Livré">Livré</option>
                          <option value="Annulé">Annulé</option>
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Statut de Paiement</label>
                        <select
                          className="form-control"
                          name="payment_status"
                          value={editCommande.payment_status}
                          onChange={handleEditCommandeInputChange}
                          required
                        >
                          <option value="En cours">En cours</option>
                          <option value="Payé">Payé</option>
                          <option value="Annulé">Annulé</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <h6>Ajouter un Produit</h6>
                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Produit</label>
                          <select
                            className="form-control"
                            name="produit_id"
                            value={newProduit.produit_id}
                            onChange={handleProduitInputChange}
                          >
                            <option value="">Sélectionner un produit</option>
                            {produits.map(produit => (
                              <option key={produit.id} value={produit.id}>{produit.nomProduit}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label">Prix (DH)</label>
                          <input
                            type="number"
                            className="form-control"
                            name="prix"
                            value={newProduit.prix}
                            onChange={handleProduitInputChange}
                            step="0.01"
                          />
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label">Quantité</label>
                          <input
                            type="number"
                            className="form-control"
                            name="quantite"
                            value={newProduit.quantite}
                            onChange={handleProduitInputChange}
                            min="1"
                          />
                        </div>
                        <div className="col-md-2 mb-3 d-flex align-items-end">
                          <button
                            type="button"
                            className="btn btn-primary w-100"
                            onClick={() => handleAddProduit(true)}
                          >
                            <i className="bi bi-plus-circle"></i>
                          </button>
                        </div>
                      </div>
                      {editCommande.produits.length > 0 && (
                        <div className="mt-3">
                          <h6>Produits Sélectionnés</h6>
                          <table className="table table-sm">
                            <thead>
                              <tr>
                                <th>Nom</th>
                                <th>Prix (DH)</th>
                                <th>Quantité</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {editCommande.produits.map((produit, index) => (
                                <tr key={index}>
                                  <td>{produits.find(p => p.id === produit.produit_id)?.nomProduit || 'Produit inconnu'}</td>
                                  <td>{typeof produit.prix === 'number' ? produit.prix.toFixed(2) : 'N/A'}</td>
                                  <td>{produit.quantite}</td>
                                  <td>
                                    <button
                                      type="button"
                                      className="btn btn-danger btn-sm"
                                      onClick={() => handleRemoveProduit(index, true)}
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowEditPopup(false)}
                      >
                        Annuler
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Enregistrer
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDetailPopup && selectedCommande && (
          <div
            className="modal d-block"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowDetailPopup(false)}
          >
            <div
              className="modal-dialog modal-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Détails de la Commande: {selectedCommande.id}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowDetailPopup(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p><strong>Client:</strong> {selectedCommande.client}</p>
                  <p><strong>Créée par:</strong> {selectedCommande.user || 'Unknown'}</p>
                  <p><strong>Date:</strong> {selectedCommande.date}</p>
                  <p><strong>Statut:</strong> {selectedCommande.status}</p>
                  <p><strong>Statut de Paiement:</strong> {selectedCommande.paymentStatus}</p>
                  <p><strong>Total:</strong> {calculateTotal(selectedCommande.produits)} DH</p>
                  <h6>Produits</h6>
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Prix (DH)</th>
                        <th>Quantité</th>
                        <th>Total (DH)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCommande.produits.map((produit, index) => (
                        <tr key={index}>
                          <td>{produit.nomProduit}</td>
                          <td>{produit.prix.toFixed(2)}</td>
                          <td>{produit.quantite}</td>
                          <td>{(produit.prix * produit.quantite).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowDetailPopup(false)}
                    >
                      Fermer
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => handleDownloadBonCommande(selectedCommande)}
                    >
                      Télécharger Bon de Commande
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Commandes;