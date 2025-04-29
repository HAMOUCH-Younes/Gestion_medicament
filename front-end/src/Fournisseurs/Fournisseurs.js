import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Layout from '../Layout/Layout';


const Fournisseurs = () => {
  const [search, setSearch] = useState('');
  const [fournisseurs, setFournisseurs] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);
  const [newFournisseur, setNewFournisseur] = useState({
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    nom_societe: '',
  });
  const [editFournisseur, setEditFournisseur] = useState(null);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const apiUrl = 'http://localhost:8000/api';

  const api = axios.create({
    baseURL: apiUrl,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      'Accept': 'application/json',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userResponse, fournisseursResponse] = await Promise.all([
          api.get('/user'),
          api.get('/fournisseurs'),
        ]);
        setCurrentUser(userResponse.data);
        setFournisseurs(fournisseursResponse.data);
        setErrorMessage('');
      } catch (error) {
        console.error('Error fetching data:', error.response || error);
        setErrorMessage('Échec du chargement des données : ' + (error.response?.data?.message || error.message));
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewFournisseur((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFournisseur((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateNewFournisseur = () => {
    const newErrors = {};
    if (!newFournisseur.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!newFournisseur.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newFournisseur.email))
      newErrors.email = 'Un email valide est requis';
    if (!newFournisseur.telephone.trim()) newErrors.telephone = 'Le téléphone est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEditFournisseur = () => {
    const newErrors = {};
    if (!editFournisseur.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!editFournisseur.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFournisseur.email))
      newErrors.email = 'Un email valide est requis';
    if (!editFournisseur.telephone.trim()) newErrors.telephone = 'Le téléphone est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddFournisseur = async (e) => {
    e.preventDefault();
    if (!validateNewFournisseur()) {
      setErrorMessage('Veuillez remplir tous les champs requis correctement.');
      return;
    }

    try {
      const response = await api.post('/fournisseurs', newFournisseur);
      setFournisseurs((prev) => [...prev, response.data]);
      setNewFournisseur({
        nom: '',
        email: '',
        telephone: '',
        adresse: '',
        nom_societe: '',
      });
      setShowPopup(false);
      setErrors({});
      setErrorMessage('');
    } catch (error) {
      console.error('Error adding fournisseur:', error.response || error);
      if (error.response?.status === 401) {
        navigate('/');
      }
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        setErrors(errors);
        const errorMessages = Object.values(errors).flat().join(' ');
        setErrorMessage(`Échec de l'ajout du fournisseur : ${errorMessages}`);
      } else if (error.response?.status === 403) {
        setErrorMessage('Vous n\'avez pas l\'autorisation d\'ajouter un fournisseur.');
      } else {
        setErrorMessage('Échec de l\'ajout du fournisseur : ' + (error.response?.data?.message || 'Erreur inconnue'));
      }
    }
  };

  const handleEditFournisseur = async (e) => {
    e.preventDefault();
    if (!validateEditFournisseur()) {
      setErrorMessage('Veuillez remplir tous les champs requis correctement.');
      return;
    }

    try {
      const response = await api.put(`/fournisseurs/${editFournisseur.id}`, editFournisseur);
      setFournisseurs((prev) =>
        prev.map((fournisseur) =>
          fournisseur.id === editFournisseur.id ? response.data : fournisseur
        )
      );
      setEditFournisseur(null);
      setShowEditPopup(false);
      setErrors({});
      setErrorMessage('');
    } catch (error) {
      console.error('Error updating fournisseur:', error.response || error);
      if (error.response?.status === 401) {
        navigate('/');
      }
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        setErrors(errors);
        const errorMessages = Object.values(errors).flat().join(' ');
        setErrorMessage(`Échec de la mise à jour du fournisseur : ${errorMessages}`);
      } else if (error.response?.status === 403) {
        setErrorMessage('Vous n\'avez pas l\'autorisation de modifier ce fournisseur.');
      } else {
        setErrorMessage('Échec de la mise à jour du fournisseur : ' + (error.response?.data?.message || 'Erreur inconnue'));
      }
    }
  };

  const handleEditClick = (e, fournisseur) => {
    e.stopPropagation();
    setEditFournisseur({ ...fournisseur });
    setErrors({});
    setShowEditPopup(true);
  };

  const handleDetailsClick = (fournisseur) => {
    setSelectedFournisseur(fournisseur);
    setShowDetailsPopup(true);
  };

  const handleDeleteClick = async (e, fournisseurId) => {
    e.stopPropagation();
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      return;
    }

    try {
      await api.delete(`/fournisseurs/${fournisseurId}`);
      setFournisseurs((prev) => prev.filter((fournisseur) => fournisseur.id !== fournisseurId));
      setShowDetailsPopup(false);
      setSelectedFournisseur(null);
      setErrorMessage('');
    } catch (error) {
      console.error('Error deleting fournisseur:', error.response || error);
      if (error.response?.status === 401) {
        navigate('/');
      } else if (error.response?.status === 403) {
        setErrorMessage('Vous n\'avez pas l\'autorisation de supprimer ce fournisseur.');
      } else if (error.response?.status === 400) {
        setErrorMessage('Impossible de supprimer : ce fournisseur est associé à des produits.');
      } else {
        setErrorMessage('Échec de la suppression du fournisseur : ' + (error.response?.data?.message || 'Erreur inconnue'));
      }
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Liste des Fournisseurs', 14, 22);
    const columns = [
      { header: 'ID', dataKey: 'id' },
      { header: 'Nom', dataKey: 'nom' },
      { header: 'Email', dataKey: 'email' },
      { header: 'Téléphone', dataKey: 'telephone' },
      { header: 'Adresse', dataKey: 'adresse' },
      { header: 'Société', dataKey: 'nom_societe' },
    ];
    const rows = fournisseurs.map((fournisseur) => ({
      id: fournisseur.id,
      nom: fournisseur.nom,
      email: fournisseur.email,
      telephone: fournisseur.telephone,
      adresse: fournisseur.adresse || 'Non spécifiée',
      nom_societe: fournisseur.nom_societe || 'Non spécifiée',
    }));
    autoTable(doc, {
      columns,
      body: rows,
      startY: 30,
      theme: 'striped',
      headStyles: { fillColor: [44, 44, 84] },
      styles: { fontSize: 10 },
    });
    doc.save('fournisseurs.pdf');
  };

  const handleDownloadFournisseurPDF = (fournisseur) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    let yPosition = margin;

    const addHeader = () => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('[Company Logo]', margin, yPosition);
      yPosition += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Zakaria Medicament', margin, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('123 Business Street, Tiznit, Morocco', margin, yPosition);
      yPosition += 5;
      doc.text('Phone: +212 682-106782 | Email: contact@gmail.com', margin, yPosition);
      yPosition += 10;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Détails du Fournisseur', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
      doc.setLineWidth(0.5);
      doc.setDrawColor(100, 100, 100);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
    };

    const addFooter = () => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text(
        'Generated by Zakaria Medicament | All rights reserved',
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.setTextColor(0, 0, 0);
    };

    addHeader();
    addFooter();

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Informations du Fournisseur', margin, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`ID: ${fournisseur.id}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Nom: ${fournisseur.nom}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Email: ${fournisseur.email}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Téléphone: ${fournisseur.telephone}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Adresse: ${fournisseur.adresse || 'Non spécifiée'}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Nom de la Société: ${fournisseur.nom_societe || 'Non spécifiée'}`, margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for your partnership!', pageWidth / 2, yPosition, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    doc.save(`Fournisseur_${fournisseur.id}_${fournisseur.nom}.pdf`);
  };

  const filteredFournisseurs = fournisseurs.filter((fournisseur) =>
    fournisseur.nom.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1>Fournisseurs</h1>
          <div>
            <button
              className="btn btn-primary me-2"
              onClick={() => setShowPopup(true)}
            >
              <i className="bi bi-plus-circle me-2"></i>Ajouter Fournisseur
            </button>
            <button
              className="btn btn-success"
              onClick={handleDownloadPDF}
              disabled={fournisseurs.length === 0}
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
                placeholder="Rechercher un fournisseur..."
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
                    <th style={{ minWidth: '220px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFournisseurs.length > 0 ? (
                    filteredFournisseurs.map((fournisseur) => (
                      <tr
                        key={fournisseur.id}
                        onClick={() => handleDetailsClick(fournisseur)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{fournisseur.id}</td>
                        <td>{fournisseur.nom}</td>
                        <td>{fournisseur.email}</td>
                        <td>{fournisseur.telephone}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-primary me-2"
                            style={{
                              backgroundColor: '#007bff',
                              borderColor: '#007bff',
                              padding: '6px 12px',
                              fontSize: '14px',
                              minWidth: '80px',
                            }}
                            onClick={(e) => handleEditClick(e, fournisseur)}
                            title="Éditer"
                          >
                            <i className="bi bi-pencil me-1"></i> Éditer
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{
                              backgroundColor: '#dc3545',
                              borderColor: '#dc3545',
                              padding: '6px 12px',
                              fontSize: '14px',
                              minWidth: '80px',
                            }}
                            onClick={(e) => handleDeleteClick(e, fournisseur.id)}
                            title="Supprimer"
                          >
                            <i className="bi bi-trash me-1"></i> Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">
                        Aucun fournisseur trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add Fournisseur Popup Modal */}
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
                  <h5 className="modal-title">Ajouter un Nouveau Fournisseur</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowPopup(false);
                      setErrors({});
                      setNewFournisseur({
                        nom: '',
                        email: '',
                        telephone: '',
                        adresse: '',
                        nom_societe: '',
                      });
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  {errorMessage && (
                    <div className="alert alert-danger" role="alert">
                      {errorMessage}
                    </div>
                  )}
                  <form onSubmit={handleAddFournisseur}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Nom</label>
                        <input
                          type="text"
                          className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                          name="nom"
                          value={newFournisseur.nom}
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
                          value={newFournisseur.email}
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
                          value={newFournisseur.telephone}
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
                          value={newFournisseur.adresse}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Nom de la Société</label>
                        <input
                          type="text"
                          className="form-control"
                          name="nom_societe"
                          value={newFournisseur.nom_societe}
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
                        disabled={!newFournisseur.nom || !newFournisseur.email || !newFournisseur.telephone}
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

        {/* Edit Fournisseur Popup Modal */}
        {showEditPopup && editFournisseur && (
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
                  <h5 className="modal-title">Modifier le Fournisseur: {editFournisseur.nom}</h5>
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
                  <form onSubmit={handleEditFournisseur}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Nom</label>
                        <input
                          type="text"
                          className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                          name="nom"
                          value={editFournisseur.nom}
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
                          value={editFournisseur.email}
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
                          value={editFournisseur.telephone}
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
                          value={editFournisseur.adresse}
                          onChange={handleEditInputChange}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Nom de la Société</label>
                        <input
                          type="text"
                          className="form-control"
                          name="nom_societe"
                          value={editFournisseur.nom_societe}
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
                        disabled={!editFournisseur.nom || !editFournisseur.email || !editFournisseur.telephone}
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

        {/* Details Fournisseur Popup Modal */}
        {showDetailsPopup && selectedFournisseur && (
          <div
            className="modal d-block"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowDetailsPopup(false)}
          >
            <div
              className="modal-dialog modal-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Détails du Fournisseur: {selectedFournisseur.nom}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowDetailsPopup(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <strong>ID:</strong> {selectedFournisseur.id}
                  </div>
                  <div className="mb-3">
                    <strong>Nom:</strong> {selectedFournisseur.nom}
                  </div>
                  <div className="mb-3">
                    <strong>Email:</strong> {selectedFournisseur.email}
                  </div>
                  <div className="mb-3">
                    <strong>Téléphone:</strong> {selectedFournisseur.telephone}
                  </div>
                  <div className="mb-3">
                    <strong>Adresse:</strong> {selectedFournisseur.adresse || 'Non spécifiée'}
                  </div>
                  <div className="mb-3">
                    <strong>Nom de la Société:</strong> {selectedFournisseur.nom_societe || 'Non spécifiée'}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-success me-2"
                    onClick={() => handleDownloadFournisseurPDF(selectedFournisseur)}
                  >
                    <i className="bi bi-download me-2"></i>Télécharger les informations
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDetailsPopup(false)}
                  >
                    Fermer
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

export default Fournisseurs;