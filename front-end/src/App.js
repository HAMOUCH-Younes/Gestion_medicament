import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login/Login';
import Welcome from './pages/Welcome/Welcom';
import Dashboard from './Dashboard/Dashboard';
import Produits from './Produits/Produits';
import Clients from './Clients/Clients';
import Fournisseurs from './Fournisseurs/Fournisseurs';
import Commandes from './Commandes/Commandes';
import Utilisateurs from './Utilisateurs/Utilisateurs';
import './App.css';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/produits" element={<Produits />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/fournisseurs" element={<Fournisseurs />} />
        <Route path="/commandes" element={<Commandes />} />
        <Route path="/utilisateurs" element={<Utilisateurs />} />
      </Routes>
    </Router>
  );
};

export default App;
