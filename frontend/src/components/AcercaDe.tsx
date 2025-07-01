import React from 'react';

const AcercaDe: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-md mt-8">
      <div className="flex flex-col items-center mb-8">
        {/* Logo institucional */}
        <img
          src="/logo-cft.png"
          alt="Logo CFT San Agustín de Talca"
          className="h-24 mb-4 bg-white rounded shadow"
        />
        <h1 className="text-4xl font-extrabold text-blue-900 mb-2 text-center">Sistema de Estacionamiento Inteligente</h1>
        <p className="text-lg text-gray-700 text-center max-w-xl">Sistema integral de gestión y monitoreo de estacionamiento inteligente, desarrollado por estudiantes del CFT San Agustín de Talca, sede Cauquenes.</p>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-blue-800 mb-3 text-center">Resumen del Proyecto</h2>
        <p className="text-gray-800 mb-4 text-justify">
          Este proyecto integra hardware y software para la gestión eficiente de un estacionamiento inteligente. El sistema abarca desde la detección física de vehículos con sensores conectados a un circuito Arduino, hasta la administración y monitoreo en tiempo real a través de una aplicación web y una app móvil.
        </p>
        <ul className="list-disc pl-8 text-gray-700 space-y-1 text-justify text-left">
          <li><span className="font-semibold">Circuito Arduino:</span> Sensores y actuadores para detectar presencia de vehículos, controlar leds y pantallas LCD, enviar datos en tiempo real.</li>
          <li><span className="font-semibold">App móvil:</span> Permite a los usuarios consultar disponibilidad, configurar precio por hora y recibir notificaciones.</li>
          <li><span className="font-semibold">Aplicación web:</span> Panel de administración para monitoreo, métricas, historial, configuración de impresora, exportación de reportes y visualización de información en tiempo real.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-blue-800 mb-3 text-center">Arquitectura del Sistema</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-700 mb-2">Frontend Web</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• React 18 con TypeScript</li>
              <li>• Vite como build tool</li>
              <li>• Tailwind CSS para estilos</li>
              <li>• Firebase Auth (OAuth 2.0)</li>
              <li>• React Router para navegación</li>
            </ul>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-700 mb-2">Backend & Base de Datos</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Node.js con Express</li>
              <li>• MongoDB Atlas (Cloud)</li>
              <li>• Firebase Realtime Database</li>
              <li>• JWT para autenticación</li>
              <li>• API RESTful</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-blue-800 mb-3 text-center">Tecnologías Utilizadas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 justify-items-center items-center mt-6">
          {/* Frontend */}
          <div className="flex flex-col items-center">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" alt="React" className="h-12 mb-2" />
            <span className="text-sm font-medium text-gray-700">React</span>
          </div>
          <div className="flex flex-col items-center">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" alt="TypeScript" className="h-12 mb-2" />
            <span className="text-sm font-medium text-gray-700">TypeScript</span>
          </div>
          <div className="flex flex-col items-center">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vite/vite-original.svg" alt="Vite" className="h-12 mb-2" />
            <span className="text-sm font-medium text-gray-700">Vite</span>
          </div>
          <div className="flex flex-col items-center">
            <img src="/tailwindcss.png" alt="Tailwind CSS" className="h-12 mb-2" />
            <span className="text-sm font-medium text-gray-700">Tailwind CSS</span>
          </div>

          {/* Backend */}
          <div className="flex flex-col items-center">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" alt="Node.js" className="h-12 mb-2" />
            <span className="text-sm font-medium text-gray-700">Node.js</span>
          </div>
          <div className="flex flex-col items-center">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" alt="Express" className="h-12 mb-2 bg-white rounded" />
            <span className="text-sm font-medium text-gray-700">Express</span>
          </div>

          {/* Base de Datos */}
          <div className="flex flex-col items-center">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg" alt="MongoDB" className="h-12 mb-2" />
            <span className="text-sm font-medium text-gray-700">MongoDB Atlas</span>
          </div>
          <div className="flex flex-col items-center">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg" alt="Firebase" className="h-12 mb-2" />
            <span className="text-sm font-medium text-gray-700">Firebase</span>
          </div>

          {/* Hardware */}
          <div className="flex flex-col items-center">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/arduino/arduino-original.svg" alt="Arduino" className="h-12 mb-2" />
            <span className="text-sm font-medium text-gray-700">Arduino</span>
          </div>

          {/* Mobile */}
          <div className="flex flex-col items-center">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg" alt="Kotlin" className="h-12 mb-2" />
            <span className="text-sm font-medium text-gray-700">Kotlin</span>
          </div>

          {/* Herramientas */}
          <div className="flex flex-col items-center">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" alt="Git" className="h-12 mb-2" />
            <span className="text-sm font-medium text-gray-700">Git</span>
          </div>
          <div className="flex flex-col items-center">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" alt="GitHub" className="h-12 mb-2 bg-white rounded-full p-1 border" />
            <span className="text-sm font-medium text-gray-700">GitHub</span>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-blue-800 mb-3 text-center">Características Principales</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">🔐 Autenticación Segura</h3>
            <p className="text-sm text-gray-700">OAuth 2.0 con Google, protección de rutas y logout seguro</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">📊 Monitoreo en Tiempo Real</h3>
            <p className="text-sm text-gray-700">Dashboard con métricas, gráficos y estado actual de espacios</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">🖨️ Impresión Inteligente</h3>
            <p className="text-sm text-gray-700">Soporte para impresoras térmicas y tradicionales con configuración avanzada</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">📱 Notificaciones</h3>
            <p className="text-sm text-gray-700">Sistema de notificaciones con debounce para evitar duplicados</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">📈 Historial Completo</h3>
            <p className="text-sm text-gray-700">Registro detallado con filtros, exportación y reimpresión</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">⚙️ Configuración Avanzada</h3>
            <p className="text-sm text-gray-700">Panel de configuración integrado para impresoras y sistema</p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-blue-800 mb-3 text-center">Equipo de Trabajo</h2>
        <ul className="pl-8 text-gray-700 space-y-1 text-justify text-left">
          <li><span className="font-semibold">Erik Garcia</span> — Docente y mentor, apoyo fundamental en el desarrollo y guía del proyecto.</li>
          <li><span className="font-semibold">Diego Ortíz</span> — Desarrollador y estudiante.</li>
          <li><span className="font-semibold">Fabian Hernández</span> — Desarrollador y estudiante.</li>
          <li><span className="font-semibold">Walter Paredes</span> — Desarrollador y estudiante.</li>
        </ul>
        <p className="mt-3 text-gray-700 text-base text-justify">
          Estudiantes de la carrera <span className="font-semibold">Analistas Programadores</span> del <span className="font-semibold">CFT San Agustín de Talca</span>, sede Cauquenes.
        </p>
      </section>

      <section className="mb-2">
        <h2 className="text-2xl font-bold text-blue-800 mb-3 text-center">Contacto</h2>
        <p className="text-gray-700 text-justify">Para más información o colaboración, contáctanos a través del correo institucional o visita nuestro repositorio en GitHub (próximamente).</p>
      </section>
    </div>
  );
};

export default AcercaDe; 