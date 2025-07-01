import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, History, Settings, LogOut, Menu, X, Info } from 'lucide-react';
import { onValue } from 'firebase/database';
import { configuracionRef } from '../../services/firebase';
import { signOut, auth, onAuthStateChanged } from '../../services/firebase';
import { useToast } from './ToastContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [estadoImpresora, setEstadoImpresora] = useState('Desconectada');
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Historial', href: '/historial', icon: History },
    { name: 'Configuraciones', href: '/configuracion', icon: Settings },
    { name: 'Acerca de', href: '/acerca', icon: Info },
  ];

  useEffect(() => {
    const unsubscribe = onValue(configuracionRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.impresora?.conexion?.estado) {
        setEstadoImpresora(data.impresora.conexion.estado);
      }
    });

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => {
      unsubscribe();
      authUnsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast('success', 'Sesión cerrada correctamente.');
      navigate('/');
    } catch (error) {
      showToast('error', 'Error al cerrar sesión.');
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'conectada':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header mejorado */}
      <header className="bg-white shadow-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition-colors mr-3"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <a href="/" className="text-2xl font-extrabold text-blue-800 tracking-tight hover:text-blue-600 transition-colors">Sistema de Estacionamiento</a>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  {user.photoURL && (
                    <img src={user.photoURL} alt={user.displayName || 'Usuario'} className="w-9 h-9 rounded-full border shadow-sm" />
                  )}
                  <span className="text-gray-800 font-medium max-w-[120px] truncate" title={user.displayName}>{user.displayName}</span>
                </>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg lg:shadow-none transform transition-transform duration-200 ease-in-out lg:transition-none`}>
          <div className="h-full flex flex-col">
            <div className="flex-1 p-4">
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </nav>

        {/* Overlay para móvil */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 p-4 lg:p-8">
            {children}
          </div>
          
          {/* Footer mejorado */}
          <footer className="w-full py-6 bg-gradient-to-t from-gray-100 to-white border-t shadow-inner flex flex-col items-center justify-center space-y-2">
            <div className="font-semibold text-gray-700">
              <a href="https://costadev.xyz" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline hover:text-blue-900 transition-all duration-150">CostaDev</a> @2025 todos los derechos reservados.
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Layout; 