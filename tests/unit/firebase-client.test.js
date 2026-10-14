import { describe, expect, it } from 'vitest';
import { readFirebaseConfig } from '../../src/services/firebase/client.js';

describe('readFirebaseConfig', () => {
  it('maps required public environment variables to Firebase config', () => {
    expect(readFirebaseConfig({
      VITE_FIREBASE_API_KEY: 'public-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'taskify.firebaseapp.com',
      VITE_FIREBASE_DATABASE_URL: 'https://taskify-default-rtdb.firebaseio.com',
      VITE_FIREBASE_PROJECT_ID: 'taskify',
      VITE_FIREBASE_APP_ID: 'app-id',
    })).toEqual({
      apiKey: 'public-key',
      authDomain: 'taskify.firebaseapp.com',
      databaseURL: 'https://taskify-default-rtdb.firebaseio.com',
      projectId: 'taskify',
      appId: 'app-id',
    });
  });

  it('reports missing configuration keys clearly', () => {
    expect(() => readFirebaseConfig({})).toThrow(/VITE_FIREBASE_API_KEY/);
  });
});