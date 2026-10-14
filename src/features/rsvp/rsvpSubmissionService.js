import { push, ref, update } from 'firebase/database';
import { getFirebaseClient } from '../../services/firebase/client.js';
import { editCapabilityPath, inboxPath } from '../../services/firebase/paths.js';
import { getPublishedEvent } from '../event/publicEventRepository.js';
import { normalizeName } from '../guests/normalizeName.js';

function createEditToken() {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function submitRsvp({ eventId, name, decision, message = '' }) {
  const normalizedName = normalizeName(name);
  const displayName = name.trim().replace(/\s+/gu, ' ');
  const trimmedMessage = message.trim();
  if (!displayName) throw new Error('Informe seu nome.');
  if (displayName.length > 100) throw new Error('O nome deve ter até 100 caracteres.');
  if (!['confirmed', 'declined'].includes(decision)) throw new Error('Escolha uma opção de resposta.');
  if (trimmedMessage.length > 500) throw new Error('A mensagem deve ter até 500 caracteres.');
  if (!await getPublishedEvent(eventId)) throw new Error('Este evento não está disponível.');

  const { database } = getFirebaseClient();
  const submissionId = push(ref(database, inboxPath(eventId))).key;
  if (!submissionId) throw new Error('Não foi possível registrar sua resposta.');
  const token = createEditToken();
  const timestamp = Date.now();
  const capability = {
    eventId,
    submissionId,
    name: displayName,
    decision,
    message: trimmedMessage,
    createdAt: timestamp,
    updatedAt: timestamp,
    status: 'unmatched',
  };

  await update(ref(database), {
    [`${inboxPath(eventId)}/${submissionId}`]: {
      token,
      name: displayName,
      normalizedName,
      decision,
      message: trimmedMessage,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: 'unmatched',
    },
    [editCapabilityPath(token)]: capability,
  });

  return { ...capability, token };
}