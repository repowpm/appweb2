// Service Worker deshabilitado para evitar errores
// Este archivo se crea para evitar errores de cache y chrome-extension

// No registrar ningún evento
console.log('Service Worker deshabilitado');

// Función para desregistrar el Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  });
} 