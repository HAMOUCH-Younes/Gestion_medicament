import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../Layout/Layout';

const Utilisateurs = () => {
  const [search, setSearch] = useState('');
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [newUtilisateur, setNewUtilisateur] = useState({
    username: '',
    email: '',
    role: 'User',
    password: '',
    password_confirmation: '',
    permissions: {
      dashboard: false,
      produits: false,
      clients: false,
      fournisseurs: false,
      commandes: false,
      utilisateurs: false,
    },
  });
  const [editUtilisateur, setEditUtilisateur] = useState(null);
  const [passwordChange, setPasswordChange] = useState({
    utilisateurId: null,
    new_password: '',
    new_password_confirmation: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const apiUrl = 'http://localhost:8000/api';

  const api = axios.create({
    baseURL: apiUrl,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userResponse, usersResponse] = await Promise.all([
          api.get('/user'),
          api.get('/users'),
        ]);

        setCurrentUser(userResponse.data);
        setUtilisateurs(usersResponse.data);

        if (!userResponse.data.permissions.utilisateurs && userResponse.data.role !== 'Admin') {
          navigate('/dashboard');
          return;
        }

        setErrorMessage('');
      } catch (error) {
        console.error('Error fetching data:', error.response || error);
        setErrorMessage('Erreur lors du chargement des données : ' + (error.response?.data?.message || error.message));
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setNewUtilisateur((prev) => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [name]: checked,
        },
      }));
    } else {
      setNewUtilisateur((prev) => ({
        ...prev,
        [name]: value,
        ...(name === 'role' && value === 'User'
          ? {
              permissions: {
                ...prev.permissions,
                utilisateurs: false,
              },
            }
          : {}),
      }));
    }
    setErrorMessage('');
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setEditUtilisateur((prev) => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [name]: checked,
        },
      }));
    } else {
      setEditUtilisateur((prev) => ({
        ...prev,
        [name]: value,
        ...(name === 'role' && value === 'User'
          ? {
              permissions: {
                ...prev.permissions,
                utilisateurs: false,
              },
            }
          : {}),
      }));
    }
    setErrorMessage('');
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordChange((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrorMessage('');
  };

  const validatePassword = (password) => {
    if (!password) return 'Le mot de passe est requis.';
    if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (!/[a-z]/.test(password)) return 'Le mot de passe doit contenir au moins une lettre minuscule.';
    if (!/[A-Z]/.test(password)) return 'Le mot de passe doit contenir au moins une lettre majuscule.';
    if (!/[0-9]/.test(password)) return 'Le mot de passe doit contenir au moins un chiffre.';
    if (!/[!@#$%^&*]/.test(password))
      return 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*).';
    return '';
  };

  const transformPermissions = (permissionsObj) => {
    return Object.keys(permissionsObj).filter((key) => permissionsObj[key]);
  };

  const handleAddUtilisateur = async (e) => {
    e.preventDefault();
    if (!newUtilisateur.username || !newUtilisateur.email || !newUtilisateur.role || !newUtilisateur.password) {
      setErrorMessage('Veuillez remplir tous les champs requis.');
      return;
    }

    const passwordError = validatePassword(newUtilisateur.password);
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }
    if (newUtilisateur.password !== newUtilisateur.password_confirmation) {
      setErrorMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    const payload = {
      ...newUtilisateur,
      permissions: transformPermissions(newUtilisateur.permissions),
    };

    try {
      const response = await api.post('/users', payload);
      setUtilisateurs((prev) => [...prev, response.data]);
      setNewUtilisateur({
        username: '',
        email: '',
        role: 'User',
        password: '',
        password_confirmation: '',
        permissions: {
          dashboard: false,
          produits: false,
          clients: false,
          fournisseurs: false,
          commandes: false,
          utilisateurs: false,
        },
      });
      setErrorMessage('');
      setShowPopup(false);
    } catch (error) {
      console.error('Error adding user:', error.response || error);
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        setErrorMessage('Erreurs de validation : ' + Object.values(errors).flat().join(' '));
      } else if (error.response?.status === 403) {
        setErrorMessage('Non autorisé : Vous n\'avez pas la permission d\'ajouter des utilisateurs.');
      } else if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      } else {
        setErrorMessage('Échec de l\'ajout de l\'utilisateur : ' + (error.response?.data?.message || 'Erreur inconnue'));
      }
    }
  };

  const handleEditUtilisateur = async (e) => {
    e.preventDefault();
    if (!editUtilisateur.username || !editUtilisateur.email || !editUtilisateur.role) {
      setErrorMessage('Veuillez remplir tous les champs requis.');
      return;
    }

    const payload = {
      ...editUtilisateur,
      permissions: transformPermissions(editUtilisateur.permissions),
    };

    try {
      const response = await api.put(`/users/${editUtilisateur.id}`, payload);
      setUtilisateurs((prev) =>
        prev.map((user) => (user.id === editUtilisateur.id ? response.data : user))
      );
      setEditUtilisateur(null);
      setShowEditPopup(false);
      setErrorMessage('');
    } catch (error) {
      console.error('Error updating user:', error.response || error);
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        setErrorMessage('Erreurs de validation : ' + Object.values(errors).flat().join(' '));
      } else if (error.response?.status === 403) {
        setErrorMessage('Non autorisé : Vous n\'avez pas la permission de modifier des utilisateurs.');
      } else if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      } else {
        setErrorMessage('Échec de la mise à jour de l\'utilisateur : ' + (error.response?.data?.message || 'Erreur inconnue'));
      }
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const { utilisateurId, new_password, new_password_confirmation } = passwordChange;

    if (!new_password || !new_password_confirmation) {
      setErrorMessage('Les deux champs sont requis.');
      return;
    }
    if (new_password !== new_password_confirmation) {
      setErrorMessage('Les mots de passe ne correspondent pas.');
      return;
    }
    const passwordError = validatePassword(new_password);
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }

    try {
      await api.post(`/users/${utilisateurId}/password`, {
        new_password,
        new_password_confirmation,
      });
      setPasswordChange({
        utilisateurId: null,
        new_password: '',
        new_password_confirmation: '',
      });
      setErrorMessage('');
      setShowPasswordPopup(false);
      alert('Mot de passe mis à jour avec succès !');
    } catch (error) {
      console.error('Error changing password:', error.response || error);
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        setErrorMessage('Erreurs de validation : ' + Object.values(errors).flat().join(' '));
      } else if (error.response?.status === 403) {
        setErrorMessage('Non autorisé : Vous n\'avez pas la permission de modifier les mots de passe.');
      } else if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      } else {
        setErrorMessage('Échec de la mise à jour du mot de passe : ' + (error.response?.data?.message || 'Erreur inconnue'));
      }
    }
  };

  const handleEditClick = (utilisateur) => {
    setEditUtilisateur({ ...utilisateur });
    setShowEditPopup(true);
  };

  const handlePasswordClick = (utilisateurId) => {
    setPasswordChange({
      utilisateurId,
      new_password: '',
      new_password_confirmation: '',
    });
    setShowPasswordPopup(true);
  };

  const handleDeleteClick = async (utilisateurId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await api.delete(`/users/${utilisateurId}`);
        setUtilisateurs((prev) => prev.filter((user) => user.id !== utilisateurId));
        setErrorMessage('');
      } catch (error) {
        console.error('Error deleting user:', error.response || error);
        if (error.response?.status === 403) {
          setErrorMessage('Non autorisé : Vous n\'avez pas la permission de supprimer des utilisateurs.');
        } else if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        } else {
          setErrorMessage('Échec de la suppression de l\'utilisateur : ' + (error.response?.data?.message || 'Erreur inconnue'));
        }
      }
    }
  };

  const filteredUtilisateurs = utilisateurs.filter((utilisateur) =>
    utilisateur.username.toLowerCase().includes(search.toLowerCase())
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
          <h1>Utilisateurs</h1>
          {(currentUser.role === 'Admin' || currentUser.permissions.utilisateurs) && (
            <button className="btn btn-primary" onClick={() => setShowPopup(true)}>
              <i className="bi bi-plus-circle me-2"></i>Ajouter Utilisateur
            </button>
          )}
        </div>
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-end mb-3">
              <input
                type="text"
                className="form-control"
                style={{ maxWidth: '300px' }}
                placeholder="Rechercher un utilisateur..."
                value={search}
                onChange={handleSearch}
              />
            </div>
            <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table className="table table-hover align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Nom d'utilisateur</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th style={{ minWidth: '340px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUtilisateurs.length > 0 ? (
                    filteredUtilisateurs.map((utilisateur) => (
                      <tr key={utilisateur.id}>
                        <td>{utilisateur.id}</td>
                        <td>{utilisateur.username}</td>
                        <td>{utilisateur.email}</td>
                        <td>{utilisateur.role}</td>
                        <td>
                          {(currentUser.role === 'Admin' || currentUser.permissions.utilisateurs) && (
                            <>
                              <button
                                className="btn btn-primary me-2"
                                style={{
                                  backgroundColor: '#007bff',
                                  borderColor: '#007bff',
                                  padding: '6px 12px',
                                  fontSize: '14px',
                                  minWidth: '80px',
                                }}
                                onClick={() => handleEditClick(utilisateur)}
                                title="Éditer"
                              >
                                <i className="bi bi-pencil me-1"></i> Éditer
                              </button>
                              <button
                                className="btn btn-success me-2"
                                style={{
                                  backgroundColor: '#28a745',
                                  borderColor: '#28a745',
                                  padding: '6px 12px',
                                  fontSize: '14px',
                                  minWidth: '80px',
                                }}
                                onClick={() => handlePasswordClick(utilisateur.id)}
                                title="Changer le mot de passe"
                              >
                                <i className="bi bi-key me-1"></i> Mot de Passe
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
                                onClick={() => handleDeleteClick(utilisateur.id)}
                                title="Supprimer"
                                disabled={utilisateur.id === currentUser.id}
                              >
                                <i className="bi bi-trash me-1"></i> Supprimer
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">
                        Aucun utilisateur trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add Utilisateur Popup Modal */}
        {showPopup && (
          <div
            className="modal d-block"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowPopup(false)}
          >
            <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Ajouter un Nouvel Utilisateur</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowPopup(false);
                      setErrorMessage('');
                      setNewUtilisateur({
                        username: '',
                        email: '',
                        role: 'User',
                        password: '',
                        password_confirmation: '',
                        permissions: {
                          dashboard: false,
                          produits: false,
                          clients: false,
                          fournisseurs: false,
                          commandes: false,
                          utilisateurs: false,
                        },
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
                  <form onSubmit={handleAddUtilisateur}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Nom d'utilisateur</label>
                        <input
                          type="text"
                          className="form-control"
                          name="username"
                          value={newUtilisateur.username}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={newUtilisateur.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Rôle</label>
                        <select
                          className="form-control"
                          name="role"
                          value={newUtilisateur.role}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="User">Utilisateur</option>
                          <option value="Admin">Administrateur</option>
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Mot de passe</label>
                        <input
                          type="password"
                          className="form-control"
                          name="password"
                          value={newUtilisateur.password}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Conf Hepburn le Mot de passe</label>
                        <input
                          type="password"
                          className="form-control"
                          name="password_confirmation"
                          value={newUtilisateur.password_confirmation}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Permissions</label>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                name="dashboard"
                                checked={newUtilisateur.permissions.dashboard}
                                onChange={handleInputChange}
                                id="dashboard"
                              />
                              <label className="form-check-label" htmlFor="dashboard">
                                Accès au Tableau de Bord
                              </label>
                            </div>
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                name="produits"
                                checked={newUtilisateur.permissions.produits}
                                onChange={handleInputChange}
                                id="produits"
                              />
                              <label className="form-check-label" htmlFor="produits">
                                Accès aux Produits
                              </label>
                            </div>
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                name="clients"
                                checked={newUtilisateur.permissions.clients}
                                onChange={handleInputChange}
                                id="clients"
                              />
                              <label className="form-check-label" htmlFor="clients">
                                Accès aux Clients
                              </label>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                name="fournisseurs"
                                checked={newUtilisateur.permissions.fournisseurs}
                                onChange={handleInputChange}
                                id="fournisseurs"
                              />
                              <label className="form-check-label" htmlFor="fournisseurs">
                                Accès aux Fournisseurs
                              </label>
                            </div>
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                name="commandes"
                                checked={newUtilisateur.permissions.commandes}
                                onChange={handleInputChange}
                                id="commandes"
                              />
                              <label className="form-check-label" htmlFor="commandes">
                                Accès aux Commandes
                              </label>
                            </div>
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                name="utilisateurs"
                                checked={newUtilisateur.permissions.utilisateurs}
                                onChange={handleInputChange}
                                id="utilisateurs"
                                disabled={newUtilisateur.role === 'User'}
                              />
                              <label className="form-check-label" htmlFor="utilisateurs">
                                Accès aux Utilisateurs
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex justify-content-end">
                      <button
                        type="button"
                        className="btn btn-secondary me-2"
                        onClick={() => {
                          setShowPopup(false);
                          setErrorMessage('');
                          setNewUtilisateur({
                            username: '',
                            email: '',
                            role: 'User',
                            password: '',
                            password_confirmation: '',
                            permissions: {
                              dashboard: false,
                              produits: false,
                              clients: false,
                              fournisseurs: false,
                              commandes: false,
                              utilisateurs: false,
                            },
                          });
                        }}
                      >
                        Annuler
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Ajouter
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Utilisateur Popup Modal */}
        {showEditPopup && editUtilisateur && (
          <div
            className="modal d-block"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowEditPopup(false)}
          >
            <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Modifier l'Utilisateur: {editUtilisateur.username}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowEditPopup(false);
                      setErrorMessage('');
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  {errorMessage && (
                    <div className="alert alert-danger" role="alert">
                      {errorMessage}
                    </div>
                  )}
                  <form onSubmit={handleEditUtilisateur}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Nom d'utilisateur</label>
                        <input
                          type="text"
                          className="form-control"
                          name="username"
                          value={editUtilisateur.username}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={editUtilisateur.email}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Rôle</label>
                        <select
                          className="form-control"
                          name="role"
                          value={editUtilisateur.role}
                          onChange={handleEditInputChange}
                          required
                        >
                          <option value="User">Utilisateur</option>
                          <option value="Admin">Administrateur</option>
                        </select>
                      </div>
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Permissions</label>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                name="dashboard"
                                checked={editUtilisateur.permissions.dashboard}
                                onChange={handleEditInputChange}
                                id="editDashboard"
                              />
                              <label className="form-check-label" htmlFor="editDashboard">
                                Accès au Tableau de Bord
                              </label>
                            </div>
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                name="produits"
                                checked={editUtilisateur.permissions.produits}
                                onChange={handleEditInputChange}
                                id="editProduits"
                              />
                              <label className="form-check-label" htmlFor="editProduits">
                                Accès aux Produits
                              </label>
                            </div>
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                name="clients"
                                checked={editUtilisateur.permissions.clients}
                                onChange={handleEditInputChange}
                                id="editClients"
                              />
                              <label className="form-check-label" htmlFor="editClients">
                                Accès aux Clients
                              </label>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                name="fournisseurs"
                                checked={editUtilisateur.permissions.fournisseurs}
                                onChange={handleEditInputChange}
                                id="editFournisseurs"
                              />
                              <label className="form-check-label" htmlFor="editFournisseurs">
                                Accès aux Fournisseurs
                              </label>
                            </div>
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                name="commandes"
                                checked={editUtilisateur.permissions.commandes}
                                onChange={handleEditInputChange}
                                id="editCommandes"
                              />
                              <label className="form-check-label" htmlFor="editCommandes">
                                Accès aux Commandes
                              </label>
                            </div>
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                name="utilisateurs"
                                checked={editUtilisateur.permissions.utilisateurs}
                                onChange={handleEditInputChange}
                                id="editUtilisateurs"
                                disabled={editUtilisateur.role === 'User'}
                              />
                              <label className="form-check-label" htmlFor="editUtilisateurs">
                                Accès aux Utilisateurs
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex justify-content-end">
                      <button
                        type="button"
                        className="btn btn-secondary me-2"
                        onClick={() => {
                          setShowEditPopup(false);
                          setErrorMessage('');
                        }}
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

        {/* Change Password Popup Modal */}
        {showPasswordPopup && passwordChange.utilisateurId && (
          <div
            className="modal d-block"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowPasswordPopup(false)}
          >
            <div className="modal-dialog modal-md" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Changer le Mot de Passe:{' '}
                    {utilisateurs.find((u) => u.id === passwordChange.utilisateurId)?.username}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowPasswordPopup(false);
                      setErrorMessage('');
                      setPasswordChange({
                        utilisateurId: null,
                        new_password: '',
                        new_password_confirmation: '',
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
                  <form onSubmit={handleChangePassword}>
                    <div className="mb-3">
                      <label className="form-label">Nouveau Mot de Passe</label>
                      <input
                        type="password"
                        className={`form-control ${errorMessage ? 'is-invalid' : ''}`}
                        name="new_password"
                        value={passwordChange.new_password}
                        onChange={handlePasswordInputChange}
                        required
                        placeholder="Entrez le nouveau mot de passe"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Confirmer le Mot de Passe</label>
                      <input
                        type="password"
                        className={`form-control ${errorMessage ? 'is-invalid' : ''}`}
                        name="new_password_confirmation"
                        value={passwordChange.new_password_confirmation}
                        onChange={handlePasswordInputChange}
                        required
                        placeholder="Confirmez le mot de passe"
                      />
                      {errorMessage && <div className="invalid-feedback">{errorMessage}</div>}
                    </div>
                    <div className="d-flex justify-content-end">
                      <button
                        type="button"
                        className="btn btn-secondary me-2"
                        onClick={() => {
                          setShowPasswordPopup(false);
                          setErrorMessage('');
                          setPasswordChange({
                            utilisateurId: null,
                            new_password: '',
                            new_password_confirmation: '',
                          });
                        }}
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!passwordChange.new_password || !passwordChange.new_password_confirmation}
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
      </div>
    </Layout>
  );
};

export default Utilisateurs;