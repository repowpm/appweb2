// Script para deshabilitar Service Worker
console.log('Deshabilitando Service Worker...');

if ('serviceWorker' in navigator) {
  // Desregistrar todos los Service Workers existentes
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister().then(function(boolean) {
        console.log('Service Worker desregistrado:', boolean);
      });
    }
  });
  
  // Prevenir futuros registros
  navigator.serviceWorker.register = function() {
    console.log('Registro de Service Worker bloqueado');
    return Promise.resolve({
      installing: null,
      waiting: null,
      active: null,
      unregister: function() { return Promise.resolve(true); }
    });
  };
} 