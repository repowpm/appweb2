Sistema de Gestión de Estacionamiento
Este proyecto es un ecosistema completo para la gestión inteligente de estacionamientos, integrando hardware (Arduino), una aplicación web moderna y una aplicación móvil.

🛠️Tecnologías y Ecosistemas
1. Hardware: Arduino
Arduino UNO/Nano : Controla sensores de presencia, barreras, LEDs y pantallas LCD.
Sensores : Detectan la ocupación de los espacios en tiempo real.
Actuadores : Barreras automáticas, luces indicadoras, etc.
Comunicación : El Arduino se comunica con la aplicación web mediante WiFi/Ethernet (usando módulos como ESP8266/ESP32 o Shields Ethernet).
Programación : El firmware de Arduino está escrito en C++ usando el IDE de Arduino. Envía y recibe datos en tiempo real (por ejemplo, vía HTTP, WebSocket o MQTT).
2. Aplicación web
Interfaz : React + TypeScript + Vite
Estilos : TailwindCSS
Backend/DB : Firebase (Base de datos en tiempo real y autenticación)
Despliegue recomendado : Vercel, Netlify, Firebase Hosting
3. Aplicación Móvil (Kotlin)
Desarrollado en: Kotlin (Android)
Propósito: Permite a los operadores o usuarios autorizados gestionar el estacionamiento desde un dispositivo móvil.
Funcionalidades principales:
Visualización en tiempo real del estado de los espacios.
Consulta del historial de movimientos y entradas.
Notificaciones push sobre eventos importantes (opcional).
Acceso a métricas e informes desde el móvil.
Integración:
La aplicación móvil se conecta directamente a Firebase, igual que la aplicación web, consumiendo los mismos datos en tiempo real.
Utilice Firebase Auth para autenticación y Realtime Database para la información de los espacios, historial y configuración.
Ventajas:
Permite movilidad y gestión remota del estacionamiento.
Ideal para supervisores, operadores o usuarios con permisos especiales.
🚦 Funcionalidades principales
Monitoreo en tiempo real de los espacios de estacionamiento.
Visualización de métricas : ocupación, ingresos, tiempo promedio, etc.
Historial de movimientos : entradas, salidas y tickets generados.
Gestión de tarifas y configuración del sistema desde la web.
Impresión de billetes desde el navegador (impresión web).
Notificaciones visuales y alertas de estado.
Integración con hardware : el sistema puede recibir datos de Arduino para actualizar el estado de los espacios.
🏗️ Arquitectura y flujo de datos
Arduino detecta cambios (auto entrada/sale) y envía el estado al backend (Firebase) mediante HTTP/MQTT.
Firebase almacena y distribuye los datos en tiempo real.
La aplicación web consume los datos de Firebase y actualiza la interfaz instantáneamente.
Los usuarios pueden ver el estado, imprimir tickets y gestionar la configuración desde cualquier dispositivo.
🚀 Guía rápida de uso y despliegue
1. Clonar el repositorio
git clone https://github.com/tuusuario/tu-repo.git
cd tu-repo/frontend
2. Instalar dependencias
npm install
3. Configurar variables de entorno
Crea un archivo .enven la carpeta frontend/con tus credenciales de Firebase:

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
Puedes usar el archivo .env.ejemplocomo referencia.

4. Ejecutar en desarrollo
npm run dev
5. Despliegue en producción
Sube el frontend a Vercel, Netlify, Firebase Hosting o donde tu quieras.
Configure las variables de entorno en el panel de la plataforma elegida.
📡 Notas sobre la integración con Arduino
El firmware de Arduino debe estar programado para enviar actualizaciones a Firebase (directamente oa través de un microservicio).
Puedes usar librerías como FirebaseArduino, HTTPCliento MQTT según el hardware disponible.
La aplicación web está lista para recibir y mostrar los cambios en tiempo real.
📋 Licencia
Proyecto educativo y de libre uso. Puedes adaptarlo y mejorarlo según tus necesidades.
