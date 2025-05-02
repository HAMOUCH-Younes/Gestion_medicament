import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Layout from '../Layout/Layout';

const Clients = () => {
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showOrdersPopup, setShowOrdersPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [newClient, setNewClient] = useState({
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    nom_societe: ''
  });
  const [editClient, setEditClient] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const apiUrl = 'http://localhost:8000/api';

  const api = axios.create({
    baseURL: apiUrl,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  // Axios interceptor for 401 handling
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      console.log('Interceptor caught error:', error.response);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Token for Clients:', token);
    if (!token) {
      navigate('/');
      return;
    }

    let isMounted = true;
    const fetchUserAndClients = async () => {
      setLoading(true);
      try {
        // Fetch current user
        const userResponse = await api.get('/user');
        const user = userResponse.data;
        if (isMounted) {
          console.log('User Response:', user);
          setCurrentUser(user);
        }

        // Redirect if no clients permission
        if (!user.permissions.clients) {
          if (isMounted) navigate('/dashboard');
          return;
        }

        // Fetch clients
        const clientsResponse = await api.get('/clients');
        if (isMounted) {
          console.log('Clients Response:', clientsResponse.data);
          setClients(clientsResponse.data);
          setErrorMessage('');
        }
      } catch (error) {
        console.error('Error fetching data:', error.response || error);
        if (isMounted) {
          setErrorMessage('Failed to load data: ' + (error.response?.data?.message || error.message));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchUserAndClients();
    return () => { isMounted = false; };
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClient(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditClient(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateClient = (client) => {
    const newErrors = {};
    if (!client.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!client.email) newErrors.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(client.email)) newErrors.email = "L'email est invalide";
    if (!client.telephone) newErrors.telephone = 'Le téléphone est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!validateClient(newClient)) {
      setErrorMessage('Veuillez remplir tous les champs requis correctement.');
      return;
    }

    try {
      const response = await api.post('/clients', newClient);
      setClients(prev => [...prev, response.data]);
      setNewClient({
        nom: '',
        email: '',
        telephone: '',
        adresse: '',
        nom_societe: ''
      });
      setShowPopup(false);
      setErrors({});
      setErrorMessage('');
    } catch (error) {
      console.error('Error adding client:', error.response || error);
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        setErrors(errors);
        const errorMessages = Object.values(errors).flat().join(' ');
        setErrorMessage(`Failed to add client: ${errorMessages}`);
      } else if (error.response?.status === 403) {
        setErrorMessage('Unauthorized: You must be an Admin to add clients.');
      } else {
        setErrorMessage('Failed to add client: ' + (error.response?.data?.message || 'Unknown error'));
      }
    }
  };

  const handleEditClient = async (e) => {
    e.preventDefault();
    if (!validateClient(editClient)) {
      setErrorMessage('Veuillez remplir tous les champs requis correctement.');
      return;
    }

    try {
      const response = await api.put(`/clients/${editClient.id}`, editClient);
      setClients(prev => prev.map(client =>
        client.id === editClient.id ? response.data : client
      ));
      setEditClient(null);
      setShowEditPopup(false);
      setErrors({});
      setErrorMessage('');
    } catch (error) {
      console.error('Error updating client:', error.response || error);
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        setErrors(errors);
        const errorMessages = Object.values(errors).flat().join(' ');
        setErrorMessage(`Failed to update client: ${errorMessages}`);
      } else if (error.response?.status === 403) {
        setErrorMessage('Unauthorized: You must be an Admin to update clients.');
      } else {
        setErrorMessage('Failed to update client: ' + (error.response?.data?.message || 'Unknown error'));
      }
    }
  };

  const handleClientClick = (client) => {
    setSelectedClient({
      id: client.id,
      nom: client.nom,
      email: client.email,
      telephone: client.telephone,
      adresse: client.adresse || '',
      nom_societe: client.nom_societe || ''
    });
    setShowDetailPopup(true);
  };

  const handleEditClick = (e, client) => {
    e.stopPropagation();
    setEditClient({
      id: client.id,
      nom: client.nom,
      email: client.email,
      telephone: client.telephone,
      adresse: client.adresse || '',
      nom_societe: client.nom_societe || ''
    });
    setErrors({});
    setShowEditPopup(true);
  };

  const handleDeleteClick = (e, client) => {
    e.stopPropagation();
    setClientToDelete(client);
    setShowDeletePopup(true);
  };

  const confirmDeleteClient = async () => {
    try {
      await api.delete(`/clients/${clientToDelete.id}`);
      setClients(prev => prev.filter(client => client.id !== clientToDelete.id));
      setCommandes(prev => prev.filter(commande => commande.client_id !== clientToDelete.id));
      setShowDeletePopup(false);
      setClientToDelete(null);
      setErrorMessage('');
    } catch (error) {
      console.error('Error deleting client:', error.response || error);
      setErrorMessage('Failed to delete client: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleOrdersClick = async (e, client) => {
    e.stopPropagation();
    setSelectedClient({
      id: client.id,
      nom: client.nom,
      email: client.email,
      telephone: client.telephone,
      adresse: client.adresse || '',
      nom_societe: client.nom_societe || ''
    });
    try {
      const response = await api.get(`/clients/${client.id}/commandes`);
      setCommandes(response.data);
      setShowOrdersPopup(true);
      setErrorMessage('');
    } catch (error) {
      console.error('Error fetching orders:', error.response || error);
      setErrorMessage('Failed to load orders: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Liste des Clients', 14, 22);
    const columns = [
      { header: 'ID', dataKey: 'id' },
      { header: 'Nom', dataKey: 'nom' },
      { header: 'Email', dataKey: 'email' },
      { header: 'Téléphone', dataKey: 'telephone' },
      { header: 'Adresse', dataKey: 'adresse' },
      { header: 'Société', dataKey: 'nom_societe' }
    ];
    const rows = clients.map(client => ({
      id: client.id,
      nom: client.nom,
      email: client.email,
      telephone: client.telephone,
      adresse: client.adresse || '-',
      nom_societe: client.nom_societe || '-'
    }));
    autoTable(doc, {
      columns,
      body: rows,
      startY: 30,
      theme: 'striped',
      headStyles: { fillColor: [44, 44, 84] },
      styles: { fontSize: 10 },
    });
    doc.save('clients.pdf');
  };

  const handleDownloadOrdersPDF = (client) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    let yPosition = margin;

    const addHeader = () => {
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
      doc.text(`Commandes du Client: ${client.nom}`, pageWidth / 2, yPosition, { align: "center" });
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

    const clientOrders = commandes.filter(commande => commande.client_id === client.id);
    const columns = [
      { header: 'ID', dataKey: 'id' },
      { header: 'Date', dataKey: 'date' },
      { header: 'Total (MAD)', dataKey: 'total' },
      { header: 'Statut', dataKey: 'status' }
    ];
    const rows = clientOrders.map(commande => ({
      id: commande.id,
      date: commande.date,
      total: parseFloat(commande.total).toFixed(2),
      status: commande.status
    }));

    autoTable(doc, {
      columns,
      body: rows,
      startY: yPosition,
      theme: 'striped',
      headStyles: { fillColor: [44, 44, 84] },
      styles: { fontSize: 10 },
    });

    doc.save(`Commandes_Client_${client.id}_${client.nom}.pdf`);
  };

  const filteredClients = clients.filter((client) =>
    client.nom.toLowerCase().includes(search.toLowerCase())
  );

  const isAddFormValid = newClient.nom && newClient.email && /\S+@\S+\.\S+/.test(newClient.email) && newClient.telephone;
  const isEditFormValid = editClient && editClient.nom && editClient.email && /\S+@\S+\.\S+/.test(editClient.email) && editClient.telephone;

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
    return null; // Or <Navigate to="/" />
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
          <h1>Clients</h1>
          <div>
            {currentUser.role !== 'User' && (
              <button 
                className="btn btn-primary me-2"
                onClick={() => setShowPopup(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>Ajouter Client
              </button>
            )}
            <button 
              className="btn btn-success"
              onClick={handleDownloadPDF}
              disabled={clients.length === 0}
            >
              <i className="bi bi-file-earmark-pdf me-2"></i>Télécharger PDF
            </button>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-end mb-3">
              <input
                type="text"
                className="form-control"
                style={{ maxWidth: '300px' }}
                placeholder="Rechercher un client..."
                value={search}
                onChange={handleSearch}
              />
            </div>
            <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table className="table table-hover align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th style={{ minWidth: '300px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <tr key={client.id}>
                        <td onClick={() => handleClientClick(client)} style={{ cursor: 'pointer' }}>{client.id}</td>
                        <td onClick={() => handleClientClick(client)} style={{ cursor: 'pointer' }}>{client.nom}</td>
                        <td onClick={() => handleClientClick(client)} style={{ cursor: 'pointer' }}>{client.email}</td>
                        <td onClick={() => handleClientClick(client)} style={{ cursor: 'pointer' }}>{client.telephone}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {console.log('User Role:', currentUser?.role, 'Permissions:', currentUser?.permissions)}
                          <>
                            <button 
                              className="btn btn-primary me-2"
                              style={{
                                backgroundColor: '#007bff',
                                borderColor: '#007bff',
                                padding: '6px 12px',
                                fontSize: '14px',
                                minWidth: '80px'
                              }}
                              onClick={(e) => handleEditClick(e, client)}
                              title="Éditer"
                            >
                              <i className="bi bi-pencil me-1"></i> Éditer
                            </button>
                            <button 
                              className="btn btn-danger me-2"
                              style={{
                                backgroundColor: '#dc3545',
                                borderColor: '#dc3545',
                                padding: '6px 12px',
                                fontSize: '14px',
                                minWidth: '80px'
                              }}
                              onClick={(e) => handleDeleteClick(e, client)}
                              title="Supprimer"
                            >
                              <i className="bi bi-trash me-1"></i> Supprimer
                            </button>
                            <button 
                              className="btn btn-info"
                              style={{
                                backgroundColor: '#17a2b8',
                                borderColor: '#17a2b8',
                                padding: '6px 12px',
                                fontSize: '14px',
                                minWidth: '80px'
                              }}
                              onClick={(e) => handleOrdersClick(e, client)}
                              title="Voir Commandes"
                            >
                              <i className="bi bi-cart me-1"></i> Commandes
                            </button>
                          </>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">
                        Aucun client trouvé
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
                  <h5 className="modal-title">Ajouter un Nouveau Client</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => {
                      setShowPopup(false);
                      setErrors({});
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  {errorMessage && (
                    <div className="alert alert-danger" role="alert">
                      {errorMessage}
                    </div>
                  )}
                  <form onSubmit={handleAddClient}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Nom</label>
                        <input
                          type="text"
                          className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                          name="nom"
                          value={newClient.nom}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.nom && <div className="invalid-feedback">{errors.nom}</div>}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                          name="email"
                          value={newClient.email}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Téléphone</label>
                        <input
                          type="tel"
                          className={`form-control ${errors.telephone ? 'is-invalid' : ''}`}
                          name="telephone"
                          value={newClient.telephone}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.telephone && <div className="invalid-feedback">{errors.telephone}</div>}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Adresse</label>
                        <input
                          type="text"
                          className="form-control"
                          name="adresse"
                          value={newClient.adresse}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Nom de la Société</label>
                        <input
                          type="text"
                          className="form-control"
                          name="nom_societe"
                          value={newClient.nom_societe}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="d-flex justify-content-end">
                      <button 
                        type="button" 
                        className="btn btn-secondary me-2"
                        onClick={() => {
                          setShowPopup(false);
                          setErrors({});
                        }}
                      >
                        Annuler
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={!isAddFormValid}
                      >
                        Ajouter
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDetailPopup && selectedClient && (
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
                  <h5 className="modal-title">Détails du Client: {selectedClient.nom}</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowDetailPopup(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <strong>ID:</strong> {selectedClient.id}
                    </div>
                    <div className="col-md-6 mb-3">
                      <strong>Nom:</strong> {selectedClient.nom}
                    </div>
                    <div className="col-md-6 mb-3">
                      <strong>Email:</strong> {selectedClient.email}
                    </div>
                    <div className="col-md-6 mb-3">
                      <strong>Téléphone:</strong> {selectedClient.telephone}
                    </div>
                    <div className="col-md-6 mb-3">
                      <strong>Adresse:</strong> {selectedClient.adresse || '-'}
                    </div>
                    <div className="col-md-6 mb-3">
                      <strong>Nom de la Société:</strong> {selectedClient.nom_societe || '-'}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowDetailPopup(false)}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEditPopup && editClient && (
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
                  <h5 className="modal-title">Modifier le Client: {editClient.nom}</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => {
                      setShowEditPopup(false);
                      setErrors({});
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  {errorMessage && (
                    <div className="alert alert-danger" role="alert">
                      {errorMessage}
                    </div>
                  )}
                  <form onSubmit={handleEditClient}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Nom</label>
                        <input
                          type="text"
                          className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                          name="nom"
                          value={editClient.nom}
                          onChange={handleEditInputChange}
                          required
                        />
                        {errors.nom && <div className="invalid-feedback">{errors.nom}</div>}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                          name="email"
                          value={editClient.email}
                          onChange={handleEditInputChange}
                          required
                        />
                        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Téléphone</label>
                        <input
                          type="tel"
                          className={`form-control ${errors.telephone ? 'is-invalid' : ''}`}
                          name="telephone"
                          value={editClient.telephone}
                          onChange={handleEditInputChange}
                          required
                        />
                        {errors.telephone && <div className="invalid-feedback">{errors.telephone}</div>}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Adresse</label>
                        <input
                          type="text"
                          className="form-control"
                          name="adresse"
                          value={editClient.adresse}
                          onChange={handleEditInputChange}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Nom de la Société</label>
                        <input
                          type="text"
                          className="form-control"
                          name="nom_societe"
                          value={editClient.nom_societe}
                          onChange={handleEditInputChange}
                        />
                      </div>
                    </div>
                    <div className="d-flex justify-content-end">
                      <button 
                        type="button" 
                        className="btn btn-secondary me-2"
                        onClick={() => {
                          setShowEditPopup(false);
                          setErrors({});
                        }}
                      >
                        Annuler
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={!isEditFormValid}
                      >
                        Enregistrer
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {showOrdersPopup && selectedClient && (
          <div 
            className="modal d-block" 
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowOrdersPopup(false)}
          >
            <div 
              className="modal-dialog modal-lg" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Commandes du Client: {selectedClient.nom}</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowOrdersPopup(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-dark">
                        <tr>
                          <th>ID</th>
                          <th>Date</th>
                          <th>Total (MAD)</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commandes.filter(commande => commande.client_id === selectedClient.id).length > 0 ? (
                          commandes
                            .filter(commande => commande.client_id === selectedClient.id)
                            .map((commande) => (
                              <tr key={commande.id}>
                                <td>{commande.id}</td>
                                <td>{commande.date}</td>
                                <td>{parseFloat(commande.total).toFixed(2)}</td>
                                <td>{commande.status}</td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center">
                              Aucune commande trouvée
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-success me-2"
                    onClick={() => handleDownloadOrdersPDF(selectedClient)}
                    disabled={commandes.filter(commande => commande.client_id === selectedClient.id).length === 0}
                  >
                    <i className="bi bi-download me-2"></i>Télécharger PDF
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowOrdersPopup(false)}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeletePopup && clientToDelete && (
          <div 
            className="modal d-block" 
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowDeletePopup(false)}
          >
            <div 
              className="modal-dialog" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirmer la Suppression</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowDeletePopup(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>
                    Êtes-vous sûr de vouloir supprimer le client{' '}
                    <strong>{clientToDelete.nom}</strong> ? Cette action supprimera également toutes ses commandes.
                  </p>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowDeletePopup(false)}
                  >
                    Annuler
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={confirmDeleteClient}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Clients;