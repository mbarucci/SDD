import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { getFirebaseClient } from '../../services/firebase/client.js';

export async function registerHost(email, password) {
  const { auth } = getFirebaseClient();
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
  return user;
}

export async function signInHost(email, password) {
  const { auth } = getFirebaseClient();
  const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
  return user;
}

export async function signOutHost() {
  const { auth } = getFirebaseClient();
  await signOut(auth);
}

export async function requestPasswordReset(email) {
  const { auth } = getFirebaseClient();
  await sendPasswordResetEmail(auth, email.trim());
}