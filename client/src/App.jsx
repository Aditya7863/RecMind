import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ItemPage from './pages/ItemPage';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/item/:id" element={<ItemPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </main>
          <footer className="footer">
            <p>RecMind — Built with MERN Stack & Hybrid Recommendation Engine</p>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
