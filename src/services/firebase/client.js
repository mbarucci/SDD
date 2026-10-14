import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectDatabaseEmulator, getDatabase } from 'firebase/database';

const requiredKeys = {
  VITE_FIREBASE_API_KEY: 'apiKey',
  VITE_FIREBASE_AUTH_DOMAIN: 'authDomain',
  VITE_FIREBASE_DATABASE_URL: 'databaseURL',
  VITE_FIREBASE_PROJECT_ID: 'projectId',
  VITE_FIREBASE_APP_ID: 'appId',
};

let firebaseClient;

export function readFirebaseConfig(environment = import.meta.env) {
  const missingKeys = Object.keys(requiredKeys).filter((key) => !environment[key]);
  if (missingKeys.length > 0) {
    throw new Error(`Configuração Firebase ausente: ${missingKeys.join(', ')}`);
  }

  return Object.fromEntries(
    Object.entries(requiredKeys).map(([environmentKey, configKey]) => [
      configKey,
      environment[environmentKey],
    ]),
  );
}

export function getFirebaseClient(environment = import.meta.env) {
  if (firebaseClient) return firebaseClient;

  const appConfig = readFirebaseConfig(environment);
  const app = getApps().length === 0 ? initializeApp(appConfig) : getApp();
  const auth = getAuth(app);
  const database = getDatabase(app);

  if (environment.VITE_USE_FIREBASE_EMULATORS === 'true') {
    connectAuthEmulator(auth, 'http://127.0.0.1:9199', { disableWarnings: true });
    connectDatabaseEmulator(database, '127.0.0.1', 9001);
  }

  firebaseClient = { app, auth, database };
  return firebaseClient;
}