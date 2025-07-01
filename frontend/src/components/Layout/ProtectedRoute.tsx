import React from 'react';

interface ProtectedRouteProps {
  user: any;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, children }) => {
  // Si el usuario aún no está cargado, muestra un loader
  if (user === undefined || user === null) {
    return (
      <div className="flex items-center justify-center h-screen text-xl text-blue-700">
        Cargando...
      </div>
    );
  }

  // Si el usuario no es el autorizado, muestra acceso restringido
  if (user.email !== 'wal.paredesm@gmail.com') {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-red-100 text-red-700 px-6 py-4 rounded shadow text-lg font-semibold">
          Acceso restringido<br />
          No tienes permisos para acceder a esta sección.
        </div>
      </div>
    );
  }

  // Si el usuario es el autorizado, muestra el contenido
  return <>{children}</>;
};

export default ProtectedRoute; 