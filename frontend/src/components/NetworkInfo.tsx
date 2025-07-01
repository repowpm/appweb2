import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, Wifi, Monitor, Smartphone } from 'lucide-react';

const NetworkInfo: React.FC = () => {
  const [ipAddress, setIpAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string>('');

  const getLocalIP = async () => {
    try {
      setLoading(true);
      // Intentar obtener la IP local
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setIpAddress(data.ip);
    } catch (error) {
      // Si falla, usar localhost
      setIpAddress('localhost');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocalIP();
  }, []);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
    }
  };

  const urls = [
    {
      name: 'Acceso Local',
      url: `http://localhost:3000`,
      icon: Monitor,
      description: 'Desde esta computadora'
    },
    {
      name: 'Acceso desde Red',
      url: `http://${ipAddress}:3000`,
      icon: Wifi,
      description: 'Desde otros dispositivos en la red'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Información de Red</h2>
        <button
          onClick={getLocalIP}
          disabled={loading}
          className="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Estado de la red */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border">
        <h3 className="font-semibold text-blue-800 mb-2">Estado de la Red</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Wifi className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-sm text-gray-700">Conectado a red WiFi</span>
          </div>
          <div className="flex items-center">
            <Monitor className="w-5 h-5 text-blue-500 mr-2" />
            <span className="text-sm text-gray-700">Servidor ejecutándose</span>
          </div>
        </div>
      </div>

      {/* URLs de acceso */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">URLs de Acceso</h3>
        <div className="space-y-3">
          {urls.map((url, index) => {
            const Icon = url.icon;
            return (
              <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Icon className="w-5 h-5 text-gray-600 mr-3" />
                    <div>
                      <h4 className="font-medium text-gray-800">{url.name}</h4>
                      <p className="text-sm text-gray-600">{url.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="px-3 py-1 bg-gray-100 rounded text-sm font-mono">
                      {url.url}
                    </code>
                    <button
                      onClick={() => copyToClipboard(url.url, url.name)}
                      className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Copiar URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {copied === url.name && (
                  <div className="mt-2 text-sm text-green-600 flex items-center">
                    <span>✓ Copiado al portapapeles</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Instrucciones de uso */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg border">
        <h3 className="font-semibold text-green-800 mb-2">Instrucciones de Uso</h3>
        <div className="space-y-2 text-sm text-green-700">
          <div className="flex items-start">
            <span className="font-mono mr-2">1.</span>
            <span>Use <strong>Acceso Local</strong> si está en la misma computadora</span>
          </div>
          <div className="flex items-start">
            <span className="font-mono mr-2">2.</span>
            <span>Use <strong>Acceso desde Red</strong> si está en otro dispositivo</span>
          </div>
          <div className="flex items-start">
            <span className="font-mono mr-2">3.</span>
            <span>Si cambia de red WiFi, haga clic en "Actualizar"</span>
          </div>
          <div className="flex items-start">
            <span className="font-mono mr-2">4.</span>
            <span>La impresora debe estar configurada como predeterminada en Windows</span>
          </div>
        </div>
      </div>

      {/* Información técnica */}
      <div className="p-4 bg-gray-50 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-2">Información Técnica</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <strong>IP Actual:</strong> {loading ? 'Detectando...' : ipAddress}
          </div>
          <div>
            <strong>Puerto:</strong> 3000
          </div>
          <div>
            <strong>Protocolo:</strong> HTTP
          </div>
          <div>
            <strong>Estado:</strong> Activo
          </div>
        </div>
      </div>

      {/* Dispositivos compatibles */}
      <div className="mt-6 p-4 bg-purple-50 rounded-lg border">
        <h3 className="font-semibold text-purple-800 mb-2 flex items-center">
          <Smartphone className="w-5 h-5 mr-2" />
          Dispositivos Compatibles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-purple-700">
          <div>• Computadoras Windows</div>
          <div>• Laptops</div>
          <div>• Tablets</div>
          <div>• Teléfonos Android</div>
          <div>• iPhones</div>
          <div>• Cualquier navegador moderno</div>
        </div>
      </div>
    </div>
  );
};

export default NetworkInfo; 