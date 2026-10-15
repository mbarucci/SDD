import { get, ref, set } from 'firebase/database';
import { getFirebaseClient } from '../../services/firebase/client.js';
import { editCapabilityPath } from '../../services/firebase/paths.js';
import { normalizeCompanions } from './companionValidation.js';

export async function getEditCapability(token) {
  const { database } = getFirebaseClient();
  const snapshot = await get(ref(database, editCapabilityPath(token)));
  if (!snapshot.exists()) return null;
  const capability = snapshot.val();
  return capability.revokedAt !== undefined && capability.revokedAt !== null
    ? null
    : { ...capability, token };
}

export async function saveEditCapability(capability, fields) {
  if (
    !capability
    || (capability.revokedAt !== undefined && capability.revokedAt !== null)
  ) throw new Error('Este link não está mais disponível.');
  const { database } = getFirebaseClient();
  const { token, ...record } = capability;
  const name = fields.name.trim();
  const message = fields.message.trim();
  const submittedCompanions = normalizeCompanions(fields.companions ?? [], fields.decision);
  const companions = fields.decision === 'confirmed' && submittedCompanions.length === 0
    ? capability.previousCompanions ?? []
    : submittedCompanions;
  if (!name) throw new Error('Informe seu nome.');
  if (!['confirmed', 'declined'].includes(fields.decision)) throw new Error('Escolha uma opção de resposta.');
  if (message.length > 500) throw new Error('A mensagem deve ter até 500 caracteres.');

  const updated = {
    ...record,
    name,
    decision: fields.decision,
    message,
    updatedAt: Date.now(),
    ...(companions.length > 0 && { companions }),
  };
  if (companions.length === 0) delete updated.companions;
  if (fields.decision === 'declined' && capability.companions?.length) {
    updated.previousCompanions = capability.companions;
  } else if (fields.decision === 'confirmed') {
    delete updated.previousCompanions;
  }
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