import React, { useState } from 'react';
import { signInWithPopup, googleProvider, auth } from '../../services/firebase';
import { useToast } from '../Layout/ToastContext';

const Login: React.FC = () => {
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('success', '¡Inicio de sesión exitoso!');
    } catch (err: any) {
      setError('Error al iniciar sesión con Google.');
      showToast('error', 'Error al iniciar sesión con Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col items-center">
        <img src="/logo-cft.png" alt="Logo CFT" className="h-20 mb-4" />
        <h1 className="text-2xl font-bold text-blue-900 mb-2">Bienvenido</h1>
        <p className="text-gray-700 mb-6 text-center">Inicia sesión con tu cuenta de Google para acceder al sistema de estacionamiento.</p>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow transition-colors w-full justify-center"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.68 2.36 30.77 0 24 0 14.82 0 6.71 5.06 2.69 12.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.04l7.18 5.59C43.98 37.13 46.1 31.36 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.65c-1.13-3.36-1.13-6.99 0-10.35l-7.98-6.2C.7 16.1 0 19.01 0 22c0 2.99.7 5.9 1.96 8.55l8.71-6.9z"/><path fill="#EA4335" d="M24 44c6.48 0 11.92-2.15 15.89-5.85l-7.18-5.59c-2 1.36-4.56 2.17-8.71 2.17-6.38 0-11.87-3.63-14.33-8.85l-8.71 6.9C6.71 42.94 14.82 48 24 48z"/></g></svg>
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión con Google'}
        </button>
        {error && <div className="mt-4 text-red-600 text-sm text-center">{error}</div>}
      </div>
    </div>
  );
};

export default Login; 