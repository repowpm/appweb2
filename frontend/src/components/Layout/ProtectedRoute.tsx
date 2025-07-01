import React from 'react';

interface ProtectedRouteProps {
  user: any;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, children }) => {
  if (!user || user.email !== 'wal.paredesm@gmail.com') {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-red-100 text-red-700 px-6 py-4 rounded shadow text-lg font-semibold">
          Acceso restringido<br />
          No tienes permisos para acceder a esta sección.
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

export default ProtectedRoute; 