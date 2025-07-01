import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import Configuracion from './components/Configuracion/Configuracion';
import TestConnection from './components/TestConnection';
import Historial from './components/Historial/Historial';
import AcercaDe from './components/AcercaDe';
import Login from './components/Auth/Login';
import { auth, onAuthStateChanged } from './services/firebase';
import Toast from './components/Layout/Toast';
import { ToastContext } from './components/Layout/ToastContext';
import './App.css';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error' | 'info' | 'warning'; message: string }>(
    { show: false, type: 'success', message: '' }
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type, message: '' }), 3500);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-xl text-blue-700">Cargando...</div>;
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/acerca" element={<Layout><AcercaDe /></Layout>} />
            <Route path="/test" element={<TestConnection />} />
            {!user ? (
              <Route path="*" element={<Login />} />
            ) : (
              <>
                <Route path="/" element={<Layout><Dashboard /></Layout>} />
                <Route path="/historial" element={<Layout><Historial /></Layout>} />
                <Route path="/configuracion" element={<Layout><Configuracion /></Layout>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
          
          {/* Toast global */}
          <Toast show={toast.show} type={toast.type} message={toast.message} onClose={() => setToast({ ...toast, show: false })} />
        </div>
      </Router>
    </ToastContext.Provider>
  );
}

export default App;
