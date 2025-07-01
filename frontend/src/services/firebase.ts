import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, update } from 'firebase/database';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { firebaseConfig } from '../config/firebase-config';

// Inicializar Firebase usando la configuración centralizada
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup, signOut, onAuthStateChanged };

// Referencias a los nodos principales
export const estacionamientosRef = ref(database, 'estacionamientos');
export const historialRef = ref(database, 'historial');
export const configuracionRef = ref(database, 'configuracion');

// Funciones para actualizar datos
export const actualizarEspacio = (espacioId: string, datos: any) => {
  return update(ref(database, `estacionamientos/${espacioId}`), datos);
};

export const agregarRegistroHistorial = (datos: any) => {
  return push(historialRef, datos);
};

export const actualizarTarifa = (tarifaHora: number) => {
  return set(configuracionRef, { tarifaHora });
};

export { database, onValue, set, push, update }; 