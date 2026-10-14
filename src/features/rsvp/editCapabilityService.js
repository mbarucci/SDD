import { get, ref, set } from 'firebase/database';
import { getFirebaseClient } from '../../services/firebase/client.js';
import { editCapabilityPath } from '../../services/firebase/paths.js';

export async function getEditCapability(token) {
  const { database } = getFirebaseClient();
  const snapshot = await get(ref(database, editCapabilityPath(token)));
  return snapshot.exists() ? { ...snapshot.val(), token } : null;
}

export async function saveEditCapability(capability, fields) {
  const { database } = getFirebaseClient();
  const { token, ...record } = capability;
  const name = fields.name.trim();
  const message = fields.message.trim();
  if (!name) throw new Error('Informe seu nome.');
  if (!['confirmed', 'declined'].includes(fields.decision)) throw new Error('Escolha uma opção de resposta.');
  if (message.length > 500) throw new Error('A mensagem deve ter até 500 caracteres.');

  const updated = {
    ...record,
    name,
    decision: fields.decision,
    message,
    updatedAt: Date.now(),
  };
  if (name !== capability.name) {
    updated.status = 'unmatched';
    const previousGuestId = capability.guestId ?? capability.previousGuestId;
    if (previousGuestId) {
      updated.previousGuestId = previousGuestId;
      updated.reviewRequired = true;
    }
    delete updated.guestId;
  }
  await set(ref(database, editCapabilityPath(token)), updated);
  return { ...updated, token };
}