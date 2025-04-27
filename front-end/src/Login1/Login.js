import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleBackClick = () => {
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/login`,
        {
          email: username, // Assuming username is email
          password,
        }
      );

      const { token } = response.data;
      if (token) {
        localStorage.setItem('jwt_token', token);
        navigate('/dashboard');
      } else {
        setError('Aucun jeton reçu. Veuillez réessayer.');
      }
    } catch (err) {
      const status = err.response?.status;
      const errorMessage =
        status === 404
          ? 'Utilisateur non trouvé. Vérifiez votre adresse e-mail.'
          : status === 401
          ? 'Mot de passe incorrect. Veuillez réessayer.'
          : 'Erreur de connexion. Vérifiez vos identifiants.';
      setError(errorMessage);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow" style={{ width: '400px' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button
            onClick={handleBackClick}
            className="btn btn-outline-secondary btn-sm"
          >
            ← Retour
          </button>
          <h2 className="text-center mb-0 flex-grow-1">Connexion</h2>
        </div>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">
              Adresse e-mail
            </label>
            <input
              type="email"
              className="form-control"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Mot de passe
            </label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;