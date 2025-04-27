import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Produits = () => {
  const [search, setSearch] = useState('');
  const [produits, setProduits] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showExpiring, setShowExpiring] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [produitToDelete, setProduitToDelete] = useState(null);
  const [newProduit, setNewProduit] = useState({
    nom: '',
    categorie_id: '',
    prix_achat: '',
    prix_vente: '',
    stock: '',
    alerte_stock: '',
    date_expiration: '',
    image: null,
    description: '',
    fournisseur_id: '',
  });
  const [editProduit, setEditProduit] = useState(null);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const apiUrl = 'http://localhost:8000/api';

  const api = axios.create({
    baseURL: apiUrl,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [produitsResponse, fournisseursResponse, categoriesResponse] = await Promise.all([
          api.get('/produits'),
          axios.get(`${apiUrl}/fournisseurs`),
          axios.get(`${apiUrl}/categories`),
        ]);
        console.log('Produits Response:', produitsResponse.data); // Debug log
        setProduits(produitsResponse.data);
        setFournisseurs(fournisseursResponse.data);
        setCategories(categoriesResponse.data);
        setErrorMessage('');
      } catch (error) {
        console.error('Error fetching data:', error.response || error);
        if (error.response?.status === 401) {
          navigate('/'); // Redirect to login if unauthorized
        }
        setErrorMessage('Failed to load data: ' + (error.response?.data?.message || error.message));
      }
    };
    fetchData();
  }, [navigate]);

  const getFournisseurName = (fournisseurId) => {
    const fournisseur = fournisseurs.find((f) => f.id === parseInt(fournisseurId));
    return fournisseur ? (fournisseur.nom_societe || fournisseur.nom) : 'Non spécifié';
  };

  const getCategorieName = (categorieId) => {
    const categorie = categories.find((c) => c.id === parseInt(categorieId));
    return categorie ? categorie.nom : 'Non spécifié';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduit((prev) => ({
      ...prev,
      [name]: ['prix_achat', 'prix_vente', 'stock', 'alerte_stock'].includes(name)
        ? value === '' ? '' : parseFloat(value) || ''
        : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Updating ${name} to ${value}`);
    let newValue = value;
    if (name === 'nom') {
      newValue = value.trim();
    } else if (['prix_achat', 'prix_vente', 'stock', 'alerte_stock'].includes(name)) {
      newValue = value === '' ? '' : parseFloat(value) || 0;
      if (name === 'stock') {
        newValue = Math.floor(newValue); // Ensure stock is an integer
      }
    }
    setEditProduit((prev) => ({
      ...prev,
      [name]: newValue,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleImageUpload = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      if (isEdit) {
        setEditProduit((prev) => ({
          ...prev,
          image: file,
        }));
      } else {
        setNewProduit((prev) => ({
          ...prev,
          image: file,
        }));
      }
    }
  };

  const validateEditProduit = () => {
    const newErrors = {};
    if (!editProduit.nom.trim()) newErrors.nom = 'Le nom du produit est requis';
    if (editProduit.prix_achat === '' || isNaN(editProduit.prix_achat) || editProduit.prix_achat < 0)
      newErrors.prix_achat = "Le prix d'achat doit être un nombre positif";
    if (editProduit.prix_vente === '' || isNaN(editProduit.prix_vente) || editProduit.prix_vente < 0)
      newErrors.prix_vente = 'Le prix de vente doit être un nombre positif';
    if (
      editProduit.stock === '' ||
      isNaN(editProduit.stock) ||
      editProduit.stock < 0 ||
      !Number.isInteger(Number(editProduit.stock))
    )
      newErrors.stock = 'Le stock doit être un entier positif';
    setErrors(newErrors);
    console.log('Validation Errors:', newErrors); // Debug log
    return Object.keys(newErrors).length === 0;
  };

  const handleAddProduit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!newProduit.nom.trim()) newErrors.nom = 'Le nom du produit est requis';
    if (newProduit.prix_achat === '' || isNaN(newProduit.prix_achat) || newProduit.prix_achat < 0)
      newErrors.prix_achat = "Le prix d'achat doit être un nombre positif";
    if (newProduit.prix_vente === '' || isNaN(newProduit.prix_vente) || newProduit.prix_vente < 0)
      newErrors.prix_vente = 'Le prix de vente doit être un nombre positif';
    if (
      newProduit.stock === '' ||
      isNaN(newProduit.stock) ||
      newProduit.stock < 0 ||
      !Number.isInteger(Number(newProduit.stock))
    )
      newErrors.stock = 'Le stock doit être un entier positif';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setErrorMessage('Veuillez remplir tous les champs requis.');
      return;
    }

    const formData = new FormData();
    formData.append('nom', newProduit.nom.trim());
    formData.append('prix_achat', Number(newProduit.prix_achat).toString());
    formData.append('prix_vente', Number(newProduit.prix_vente).toString());
    formData.append('stock', Math.floor(Number(newProduit.stock)).toString());
    formData.append('alerte_stock', newProduit.alerte_stock ? Number(newProduit.alerte_stock).toString() : '10');
    formData.append('date_expiration', newProduit.date_expiration || '');
    formData.append('description', newProduit.description || '');
    if (newProduit.categorie_id) formData.append('categorie_id', newProduit.categorie_id.toString());
    if (newProduit.fournisseur_id) formData.append('fournisseur_id', newProduit.fournisseur_id.toString());
    if (newProduit.image) formData.append('image', newProduit.image);

    try {
      const response = await api.post('/produits', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('POST Response:', response.data); // Debug log

      // Normalize the new product data to match GET /api/produits structure
      const normalizedProduit = {
        id: response.data.id,
        nomProduit: response.data.nom, // Map nom to nomProduit
        categorie_id: response.data.categorie_id || null,
        categorie: newProduit.categorie_id
          ? categories.find((c) => c.id === parseInt(newProduit.categorie_id))
          : null,
        fournisseur_id: response.data.fournisseur_id || null,
        prix_achat: parseFloat(response.data.prix_achat),
        prix_vente: parseFloat(response.data.prix_vente),
        stock: parseInt(response.data.stock),
        alerte_stock: parseInt(response.data.alerte_stock) || 10,
        date_expiration: response.data.date_expiration || null,
        image: response.data.image || null,
        description: response.data.description || null,
      };

      setProduits((prev) => [...prev, normalizedProduit]);
      setNewProduit({
        nom: '',
        categorie_id: '',
        prix_achat: '',
        prix_vente: '',
        stock: '',
        alerte_stock: '',
        date_expiration: '',
        image: null,
        description: '',
        fournisseur_id: '',
      });
      setShowPopup(false);
      setErrors({});
      setErrorMessage('');
    } catch (error) {
      console.error('Error adding produit:', error.response || error);
      if (error.response?.status === 401) {
        navigate('/'); // Redirect to login if unauthorized
      }
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        setErrors(errors);
        const errorMessages = Object.values(errors).flat().join(' ');
        setErrorMessage(`Failed to add product: ${errorMessages}`);
      } else {
        setErrorMessage('Failed to add product: ' + (error.response?.data?.message || 'Unknown error'));
      }
    }
  };

  const handleEditClick = (produit) => {
    console.log('Produit to edit:', produit);
    setEditProduit({
      id: produit.id,
      nom: (produit.nomProduit || '').trim(),
      categorie_id: produit.categorie_id || '',
      fournisseur_id: produit.fournisseur_id || '',
      prix_achat: parseFloat(produit.prix_achat) || 0,
      prix_vente: parseFloat(produit.prix_vente) || 0,
      stock: parseInt(produit.stock) || 0,
      alerte_stock: parseInt(produit.alerte_stock) || 10,
      date_expiration: produit.date_expiration || '',
      image: produit.image || null,
      description: produit.description || '',
    });
    setErrors({});
    setShowEditPopup(true);
  };

  const handleEditProduit = async (e) => {
    e.preventDefault();
    console.log('editProduit before FormData:', editProduit);

    if (!validateEditProduit()) {
      setErrorMessage('Veuillez remplir tous les champs requis.');
      return;
    }

    const formData = new FormData();
    formData.append('nom', editProduit.nom.trim());
    formData.append('prix_achat', Number(editProduit.prix_achat).toString());
    formData.append('prix_vente', Number(editProduit.prix_vente).toString());
    formData.append('stock', Math.floor(Number(editProduit.stock)).toString());
    formData.append('alerte_stock', editProduit.alerte_stock ? Number(editProduit.alerte_stock).toString() : '10');
    formData.append('date_expiration', editProduit.date_expiration || '');
    formData.append('description', editProduit.description || '');
    if (editProduit.categorie_id) formData.append('categorie_id', editProduit.categorie_id.toString());
    if (editProduit.fournisseur_id) formData.append('fournisseur_id', editProduit.fournisseur_id.toString());
    if (editProduit.image instanceof File) {
      formData.append('image', editProduit.image);
    }

    for (let [key, value] of formData.entries()) {
      console.log(`FormData: ${key} = ${value}`);
    }

    try {
      const response = await api.put(`/produits/${editProduit.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      });
      console.log('Update successful:', response.data);
      setProduits((prev) =>
        prev.map((produit) =>
          produit.id === editProduit.id
            ? {
                ...response.data,
                nomProduit: response.data.nom, // Map nom to nomProduit
                categorie: editProduit.categorie_id
                  ? categories.find((c) => c.id === parseInt(editProduit.categorie_id))
                  : null,
                prix_achat: parseFloat(response.data.prix_achat),
                prix_vente: parseFloat(response.data.prix_vente),
                stock: parseInt(response.data.stock),
                alerte_stock: parseInt(response.data.alerte_stock) || 10,
              }
            : produit
        )
      );
      setEditProduit(null);
      setShowEditPopup(false);
      setErrors({});
      setErrorMessage('');
    } catch (error) {
      console.error('Error updating produit:', error.response || error);
      if (error.response?.status === 401) {
        navigate('/'); // Redirect to login if unauthorized
      }
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        setErrors(errors);
        const errorMessages = Object.values(errors).flat().join(' ');
        setErrorMessage(`Failed to update product: ${errorMessages}`);
      } else {
        setErrorMessage('Failed to update product: ' + (error.response?.data?.message || 'Unknown error'));
      }
    }
  };

  const handleDeleteClick = async (produitId) => {
    try {
      await api.delete(`/produits/${produitId}`);
      setProduits((prev) => prev.filter((produit) => produit.id !== produitId));
      setShowDeletePopup(false);
      setProduitToDelete(null);
      setErrorMessage('');
    } catch (error) {
      console.error('Error deleting produit:', error.response || error);
      if (error.response?.status === 401) {
        navigate('/'); // Redirect to login if unauthorized
      }
      setErrorMessage('Failed to delete product: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleProduitClick = (produit) => {
    setSelectedProduit(produit);
    setShowDetailPopup(true);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const navigateTo = (path) => {
    navigate(`/${path}`);
  };

  const handleDownloadAllProduits = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Liste de Tous les Produits', 20, 20);

    const tableColumns = [
      { header: 'ID', dataKey: 'id' },
      { header: 'Nom', dataKey: 'nom' },
      { header: 'Catégorie', dataKey: 'categorie' },
      { header: 'Fournisseur', dataKey: 'fournisseur' },
      { header: "Prix d'Achat (DH)", dataKey: 'prix_achat' },
      { header: 'Prix de Vente (DH)', dataKey: 'prix_vente' },
      { header: 'Stock disponible', dataKey: 'stock' },
      { header: 'Alerte Stock', dataKey: 'alerte_stock' },
      { header: "Date d'Expiration", dataKey: 'date_expiration' },
      { header: 'Image', dataKey: 'image' },
      { header: 'Description', dataKey: 'description' },
    ];

    const tableRows = produits.map((produit) => ({
      id: produit.id,
      nom: produit.nomProduit || 'Inconnu',
      categorie: getCategorieName(produit.categorie_id),
      fournisseur: getFournisseurName(produit.fournisseur_id),
      prix_achat: Number(produit.prix_achat).toFixed(2),
      prix_vente: Number(produit.prix_vente).toFixed(2),
      stock: `${produit.stock}${produit.stock <= produit.alerte_stock ? ' (faible)' : ''}`,
      alerte_stock: produit.alerte_stock,
      date_expiration: produit.date_expiration || '-',
      image: produit.image ? 'Présente' : 'Aucune',
      description: produit.description || '-',
    }));

    autoTable(doc, {
      columns: tableColumns,
      body: tableRows,
      startY: 30,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [44, 44, 84],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        id: { cellWidth: 10 },
        nom: { cellWidth: 25 },
        categorie: { cellWidth: 20 },
        fournisseur: { cellWidth: 20 },
        prix_achat: { cellWidth: 20 },
        prix_vente: { cellWidth: 20 },
        stock: { cellWidth: 15 },
        alerte_stock: { cellWidth: 15 },
        date_expiration: { cellWidth: 20 },
        image: { cellWidth: 15 },
        description: { cellWidth: 30 },
      },
      margin: { left: 10, right: 10 },
    });

    doc.save('Tous_les_Produits.pdf');
  };

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const expiringProduits = produits.filter((produit) => {
    if (!produit.date_expiration) return false;
    const expirationDate = new Date(produit.date_expiration);
    return expirationDate.getMonth() === currentMonth && expirationDate.getFullYear() === currentYear;
  });

  const filteredProduits = showExpiring
    ? expiringProduits
    : produits.filter((produit) =>
        produit.nomProduit && typeof produit.nomProduit === 'string'
          ? produit.nomProduit.toLowerCase().includes(search.toLowerCase())
          : false
      );

  const isEditFormValid =
    editProduit &&
    editProduit.nom &&
    (editProduit.prix_achat || editProduit.prix_achat === 0) &&
    (editProduit.prix_vente || editProduit.prix_vente === 0) &&
    (editProduit.stock || editProduit.stock === 0);

  return (
    <div className="container-fluid">
      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}
      <div className="row">
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
              <i className="bi bi-grid me-2"></i> Menu Principal
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
        <div className="col-md-9 col-lg-10 p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Produits</h1>
            <div>
              <button
                className="btn btn-warning me-2"
                onClick={() => setShowExpiring(!showExpiring)}
              >
                {showExpiring ? 'Voir Tous les Produits' : 'Produits Expirant ce Mois'}
              </button>
              <button
                className="btn btn-primary me-2"
                onClick={() => setShowPopup(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>Ajouter Produit
              </button>
              <button
                className="btn btn-success"
                onClick={handleDownloadAllProduits}
                disabled={produits.length === 0}
              >
                <i className="bi bi-download me-2"></i>Télécharger Tous
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
                  placeholder="Rechercher un produit..."
                  value={search}
                  onChange={handleSearch}
                  disabled={showExpiring}
                />
              </div>
              <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <table className="table table-hover align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th>ID</th>
                      <th>Nom</th>
                      <th>Catégorie</th>
                      <th>Stock disponible</th>
                      <th>Date Expiration</th>
                      <th style={{ minWidth: '220px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProduits.length > 0 ? (
                      filteredProduits.map((produit) => (
                        <tr key={produit.id}>
                          <td
                            onClick={() => handleProduitClick(produit)}
                            style={{ cursor: 'pointer' }}
                          >
                            {produit.id}
                          </td>
                          <td
                            onClick={() => handleProduitClick(produit)}
                            style={{ cursor: 'pointer' }}
                          >
                            {produit.nomProduit || 'Inconnu'}
                          </td>
                          <td
                            onClick={() => handleProduitClick(produit)}
                            style={{ cursor: 'pointer' }}
                          >
                            {produit.categorie ? produit.categorie.nom : getCategorieName(produit.categorie_id)}
                          </td>
                          <td
                            onClick={() => handleProduitClick(produit)}
                            style={{ cursor: 'pointer' }}
                            className={produit.stock <= produit.alerte_stock ? 'text-danger' : ''}
                          >
                            {produit.stock}
                          </td>
                          <td
                            onClick={() => handleProduitClick(produit)}
                            style={{ cursor: 'pointer' }}
                          >
                            {produit.date_expiration || '-'}
                          </td>
                          <td>
                            <button
                              className="btn btn-primary me-2"
                              style={{
                                backgroundColor: '#007bff',
                                borderColor: '#007bff',
                                padding: '6px 12px',
                                fontSize: '14px',
                                minWidth: '80px',
                              }}
                              onClick={() => handleEditClick(produit)}
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
                              onClick={() => {
                                setProduitToDelete(produit);
                                setShowDeletePopup(true);
                              }}
                              title="Supprimer"
                            >
                              <i className="bi bi-trash me-1"></i> Supprimer
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center">
                          Aucun produit {showExpiring ? 'expirant ce mois' : 'trouvé'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
                <h5 className="modal-title">Ajouter un Nouveau Produit</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowPopup(false);
                    setErrors({});
                    setNewProduit({
                      nom: '',
                      categorie_id: '',
                      prix_achat: '',
                      prix_vente: '',
                      stock: '',
                      alerte_stock: '',
                      date_expiration: '',
                      image: null,
                      description: '',
                      fournisseur_id: '',
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
                <form onSubmit={handleAddProduit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Nom du Produit</label>
                      <input
                        type="text"
                        className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                        name="nom"
                        value={newProduit.nom}
                        onChange={handleInputChange}
                        required
                      />
                      {errors.nom && <div className="invalid-feedback">{errors.nom}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Catégorie (optionnel)</label>
                      <select
                        className="form-control"
                        name="categorie_id"
                        value={newProduit.categorie_id}
                        onChange={handleInputChange}
                      >
                        <option value="">Sélectionner une catégorie</option>
                        {categories.map((categorie) => (
                          <option key={categorie.id} value={categorie.id}>
                            {categorie.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Fournisseur (optionnel)</label>
                      <select
                        className="form-control"
                        name="fournisseur_id"
                        value={newProduit.fournisseur_id}
                        onChange={handleInputChange}
                      >
                        <option value="">Sélectionner un fournisseur</option>
                        {fournisseurs.map((fournisseur) => (
                          <option key={fournisseur.id} value={fournisseur.id}>
                            {fournisseur.nom_societe || fournisseur.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Prix d'Achat (DH)</label>
                      <input
                        type="number"
                        className={`form-control ${errors.prix_achat ? 'is-invalid' : ''}`}
                        name="prix_achat"
                        value={newProduit.prix_achat}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        required
                      />
                      {errors.prix_achat && <div className="invalid-feedback">{errors.prix_achat}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Prix de Vente (DH)</label>
                      <input
                        type="number"
                        className={`form-control ${errors.prix_vente ? 'is-invalid' : ''}`}
                        name="prix_vente"
                        value={newProduit.prix_vente}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        required
                      />
                      {errors.prix_vente && <div className="invalid-feedback">{errors.prix_vente}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Stock disponible</label>
                      <input
                        type="number"
                        className={`form-control ${errors.stock ? 'is-invalid' : ''}`}
                        name="stock"
                        value={newProduit.stock}
                        onChange={handleInputChange}
                        min="0"
                        required
                      />
                      {errors.stock && <div className="invalid-feedback">{errors.stock}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Alerte Stock Minimum</label>
                      <input
                        type="number"
                        className="form-control"
                        name="alerte_stock"
                        value={newProduit.alerte_stock}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Date d'Expiration</label>
                      <input
                        type="date"
                        className="form-control"
                        name="date_expiration"
                        value={newProduit.date_expiration}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Image du Produit</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e)}
                      />
                      {newProduit.image && typeof newProduit.image === 'string' && (
                        <img
                          src={`${apiUrl}/storage/${newProduit.image}`}
                          alt="Preview"
                          style={{
                            width: '100px',
                            height: '100px',
                            objectFit: 'cover',
                            marginTop: '10px',
                          }}
                        />
                      )}
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        value={newProduit.description}
                        onChange={handleInputChange}
                        rows="4"
                      ></textarea>
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
                      disabled={
                        !(
                          newProduit.nom &&
                          (newProduit.prix_achat || newProduit.prix_achat === 0) &&
                          (newProduit.prix_vente || newProduit.prix_vente === 0) &&
                          (newProduit.stock || newProduit.stock === 0)
                        )
                      }
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
      {showEditPopup && editProduit && (
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
                <h5 className="modal-title">Modifier le Produit: {editProduit.nom}</h5>
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
                <form onSubmit={handleEditProduit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Nom du Produit</label>
                      <input
                        type="text"
                        className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                        name="nom"
                        value={editProduit.nom}
                        onChange={handleEditInputChange}
                        required
                      />
                      {errors.nom && <div className="invalid-feedback">{errors.nom}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Catégorie (optionnel)</label>
                      <select
                        className="form-control"
                        name="categorie_id"
                        value={editProduit.categorie_id}
                        onChange={handleEditInputChange}
                      >
                        <option value="">Sélectionner une catégorie</option>
                        {categories.map((categorie) => (
                          <option key={categorie.id} value={categorie.id}>
                            {categorie.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Fournisseur (optionnel)</label>
                      <select
                        className="form-control"
                        name="fournisseur_id"
                        value={editProduit.fournisseur_id}
                        onChange={handleEditInputChange}
                      >
                        <option value="">Sélectionner un fournisseur</option>
                        {fournisseurs.map((fournisseur) => (
                          <option key={fournisseur.id} value={fournisseur.id}>
                            {fournisseur.nom_societe || fournisseur.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Prix d'Achat (DH)</label>
                      <input
                        type="number"
                        className={`form-control ${errors.prix_achat ? 'is-invalid' : ''}`}
                        name="prix_achat"
                        value={editProduit.prix_achat}
                        onChange={handleEditInputChange}
                        step="0.01"
                        min="0"
                        required
                      />
                      {errors.prix_achat && <div className="invalid-feedback">{errors.prix_achat}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Prix de Vente (DH)</label>
                      <input
                        type="number"
                        className={`form-control ${errors.prix_vente ? 'is-invalid' : ''}`}
                        name="prix_vente"
                        value={editProduit.prix_vente}
                        onChange={handleEditInputChange}
                        step="0.01"
                        min="0"
                        required
                      />
                      {errors.prix_vente && <div className="invalid-feedback">{errors.prix_vente}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Stock disponible</label>
                      <input
                        type="number"
                        className={`form-control ${errors.stock ? 'is-invalid' : ''}`}
                        name="stock"
                        value={editProduit.stock}
                        onChange={handleEditInputChange}
                        min="0"
                        required
                      />
                      {errors.stock && <div className="invalid-feedback">{errors.stock}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Alerte Stock Minimum</label>
                      <input
                        type="number"
                        className="form-control"
                        name="alerte_stock"
                        value={editProduit.alerte_stock}
                        onChange={handleEditInputChange}
                        min="0"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Date d'Expiration</label>
                      <input
                        type="date"
                        className="form-control"
                        name="date_expiration"
                        value={editProduit.date_expiration}
                        onChange={handleEditInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Image du Produit</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, true)}
                      />
                      {editProduit.image && typeof editProduit.image === 'string' && (
                        <img
                          src={`${apiUrl}/storage/${editProduit.image}`}
                          alt="Preview"
                          style={{
                            width: '100px',
                            height: '100px',
                            objectFit: 'cover',
                            marginTop: '10px',
                          }}
                        />
                      )}
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        value={editProduit.description}
                        onChange={handleEditInputChange}
                        rows="4"
                      ></textarea>
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
      {showDetailPopup && selectedProduit && (
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
                <h5 className="modal-title">Détails du Produit: {selectedProduit.nomProduit || 'Inconnu'}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDetailPopup(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <strong>ID:</strong> {selectedProduit.id}
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong>Nom:</strong> {selectedProduit.nomProduit || 'Inconnu'}
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong>Catégorie:</strong> {selectedProduit.categorie ? selectedProduit.categorie.nom : getCategorieName(selectedProduit.categorie_id)}
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong>Fournisseur:</strong> {getFournisseurName(selectedProduit.fournisseur_id)}
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong>Prix d'Achat (DH):</strong> {Number(selectedProduit.prix_achat).toFixed(2)}
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong>Prix de Vente (DH):</strong> {Number(selectedProduit.prix_vente).toFixed(2)}
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong>Stock disponible:</strong> {selectedProduit.stock}
                    {selectedProduit.stock <= selectedProduit.alerte_stock && (
                      <span className="text-danger ms-2"> (Stock faible)</span>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong>Alerte Stock Minimum:</strong> {selectedProduit.alerte_stock}
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong>Date d'Expiration:</strong> {selectedProduit.date_expiration || '-'}
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong>Image:</strong>
                    {selectedProduit.image ? (
                      <img
                        src={`${apiUrl}/storage/${selectedProduit.image}`}
                        alt={selectedProduit.nomProduit}
                        style={{
                          width: '100px',
                          height: '100px',
                          objectFit: 'cover',
                          marginLeft: '10px',
                        }}
                      />
                    ) : (
                      ' Aucune image'
                    )}
                  </div>
                  <div className="col-md-12 mb-3">
                    <strong>Description:</strong> {selectedProduit.description || '-'}
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
      {showDeletePopup && produitToDelete && (
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
                  Êtes-vous sûr de vouloir supprimer le produit{' '}
                  <strong>{produitToDelete.nomProduit || 'Inconnu'}</strong> ? Cette action est irréversible.
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
                  onClick={() => handleDeleteClick(produitToDelete.id)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Produits;