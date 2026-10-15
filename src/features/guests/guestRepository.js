import { get, onValue, push, ref, runTransaction, update } from 'firebase/database';
import { getFirebaseClient } from '../../services/firebase/client.js';
import { editCapabilityPath, inboxPath, rosterPath } from '../../services/firebase/paths.js';
import { normalizeName } from './normalizeName.js';
import { normalizeGuestFields, normalizePhone } from './guestFields.js';
import { guestImportKey, prepareGuestImport } from './guestImport.js';

export { normalizePhone } from './guestFields.js';

function database() {
  return getFirebaseClient().database;
}

function guestSlotPath(eventId, slot) {
  return `${rosterPath(eventId)}/${slot}`;
}

function submissionInboxPath(eventId, submissionId) {
  return `${inboxPath(eventId)}/${submissionId}`;
}

function capabilityRecord(submission, changes) {
  const next = { ...submission, ...changes };
  delete next.token;
  delete next.inboxKey;
  delete next.inboxRecord;
  return next;
}

function storedGuest(guest) {
  const { slot, ...record } = guest;
  return record;
}

function inboxRecord(submission, changes) {
  const next = {
    ...submission.inboxRecord,
    name: submission.name,
    normalizedName: normalizeName(submission.name),
    decision: submission.decision,
    message: submission.message,
    updatedAt: submission.updatedAt,
    status: submission.status,
    companions: submission.companions?.length ? submission.companions : null,
    ...changes,
    token: submission.token,
  };
  delete next.inboxKey;
  delete next.inboxRecord;
  return next;
}

function makeEditToken() {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function saveGuestPhone(eventId, guest, value) {
  const phone = normalizePhone(value);
  await update(ref(database()), {
    [`${guestSlotPath(eventId, guest.slot)}/phone`]: phone || null,
  });
}

export async function addExpectedGuest(eventId, name, phone = '') {
  const { name: displayName, phone: normalizedPhone } = normalizeGuestFields(name, phone);
  const normalizedName = normalizeName(displayName);

  const db = database();
  const guestId = push(ref(db, rosterPath(eventId))).key;
  if (!guestId) throw new Error('Não foi possível cadastrar o convidado.');
  const guest = {
    guestId,
    name: displayName,
    normalizedName,
    status: 'pending',
    createdAt: Date.now(),
    ...(normalizedPhone && { phone: normalizedPhone }),
  };

  for (let index = 1; index <= 100; index += 1) {
    const slot = `guest-${String(index).padStart(3, '0')}`;
    const result = await runTransaction(
      ref(db, guestSlotPath(eventId, slot)),
      (current) => current === null ? guest : undefined,
      { applyLocally: false },
    );
    if (result.committed) return { ...guest, slot };
  }

  throw new Error('Este evento já atingiu o limite de 100 convidados.');
}

export async function importExpectedGuests(eventId, rows) {
  const validated = prepareGuestImport(rows);
  if (validated.errors.length) throw new Error(validated.errors.join(' '));
  const db = database();
  const timestamp = Date.now();
  const records = validated.guests.map((guest) => {
    const guestId = push(ref(db, rosterPath(eventId))).key;
    if (!guestId) throw new Error('Não foi possível gerar o cadastro do convidado.');
    return { ...guest, guestId };
  });
  let summary;
  let failure;
  const result = await runTransaction(ref(db, rosterPath(eventId)), (current) => {
    const roster = current ?? {};
    const preview = prepareGuestImport(records, Object.values(roster));
    failure = preview.errors.join(' ');
    if (failure) return undefined;
    const next = { ...roster };
    const pending = new Set(preview.guests.map(guestImportKey));
    const imported = records.filter((guest) => pending.has(guestImportKey(guest)));
    let slotIndex = 1;
    for (const guest of imported) {
      let slot;
      do {
        slot = `guest-${String(slotIndex).padStart(3, '0')}`;
        slotIndex += 1;
      } while (next[slot]);
      const { phone, ...fields } = guest;
      next[slot] = {
        ...fields, ...(phone && { phone }), normalizedName: normalizeName(guest.name),
        status: 'pending', createdAt: timestamp,
      };
    }
    summary = { imported: imported.length, skipped: validated.skipped + preview.skipped };
    return next;
  }, { applyLocally: false });
  if (!result.committed) throw new Error(failure || 'Não foi possível importar. Atualize a lista e tente novamente.');
  return summary;
}

export function listenToEventManagement(eventId, onChange) {
  const db = database();
  let guests = {};
  let inbox = {};
  const submissions = new Map();
  const capabilityListeners = new Map();

  function publish() {
    onChange({
      guests: Object.entries(guests).map(([slot, guest]) => ({ ...guest, slot })),
      submissions: [...submissions.values()],
    });
  }

  const stopGuests = onValue(ref(db, rosterPath(eventId)), (snapshot) => {
    guests = snapshot.val() ?? {};
    publish();
  }, (error) => onChange({ error }));

  const stopInbox = onValue(ref(db, inboxPath(eventId)), (snapshot) => {
    inbox = snapshot.val() ?? {};
    const activeIds = new Set(Object.keys(inbox));

    for (const [submissionId, listener] of capabilityListeners) {
      if (!activeIds.has(submissionId)) {
        listener.stop();
        capabilityListeners.delete(submissionId);
        submissions.delete(submissionId);
      }
    }

    for (const [submissionId, inboxRecordValue] of Object.entries(inbox)) {
      const token = inboxRecordValue.token;
      const existing = capabilityListeners.get(submissionId);
      if (existing?.token === token) continue;
      existing?.stop();

      const stop = onValue(ref(db, editCapabilityPath(token)), (capabilitySnapshot) => {
        if (capabilitySnapshot.exists()) {
          submissions.set(submissionId, {
            ...capabilitySnapshot.val(),
            token,
            inboxKey: submissionId,
            inboxRecord: inbox[submissionId] ?? inboxRecordValue,
          });
        } else {
          submissions.delete(submissionId);
        }
        publish();
      }, (error) => onChange({ error }));
      capabilityListeners.set(submissionId, { token, stop });
    }
    publish();
  }, (error) => onChange({ error }));

  return () => {
    stopGuests();
    stopInbox();
    for (const listener of capabilityListeners.values()) listener.stop();
  };
}

export async function reconcileEventInbox(eventId, guests, submissions) {
  const db = database();
  const nextGuests = new Map(guests.map((guest) => [guest.guestId, guest]));
  const writes = {};

  const orderedSubmissions = [...submissions].sort((left, right) => left.updatedAt - right.updatedAt);
  for (const submission of orderedSubmissions) {
    if (submission.revokedAt) continue;
    const priorGuestId = submission.previousGuestId;
    if (submission.reviewRequired && priorGuestId) {
      const previousGuest = nextGuests.get(priorGuestId);
      if (previousGuest?.submissionId === submission.submissionId) {
        const pendingGuest = {
          ...previousGuest,
          status: 'pending',
          submissionId: null,
          updatedAt: null,
          decision: null,
        };
        delete pendingGuest.companions;
        delete pendingGuest.associationSource;
        nextGuests.set(priorGuestId, pendingGuest);
          writes[guestSlotPath(eventId, previousGuest.slot)] = storedGuest(pendingGuest);
      }
      continue;
    }

    if (submission.reviewRequired && submission.status !== 'matched') continue;

    if (submission.status === 'matched') {
      const matchedGuest = nextGuests.get(submission.guestId);
      if (!matchedGuest || matchedGuest.submissionId !== submission.submissionId) continue;
      const currentCompanions = JSON.stringify(matchedGuest.companions ?? []);
      const nextCompanions = JSON.stringify(submission.companions ?? []);
      if (
        matchedGuest.status !== submission.decision
        || matchedGuest.updatedAt !== submission.updatedAt
        || currentCompanions !== nextCompanions
      ) {
        const updatedGuest = { ...matchedGuest, status: submission.decision, updatedAt: submission.updatedAt };
        if (submission.companions?.length) updatedGuest.companions = submission.companions;
        else delete updatedGuest.companions;
        nextGuests.set(updatedGuest.guestId, updatedGuest);
          writes[guestSlotPath(eventId, updatedGuest.slot)] = storedGuest(updatedGuest);
      }
      continue;
    }

    const candidates = [...nextGuests.values()].filter(
      (guest) => guest.normalizedName === normalizeName(submission.name),
    );
    if (candidates.length !== 1) {
      const nextStatus = candidates.length > 1 ? 'duplicate-review' : 'unmatched';
      if (submission.status !== nextStatus || submission.guestId) {
        const updatedSubmission = capabilityRecord(submission, { status: nextStatus, guestId: null });
        writes[editCapabilityPath(submission.token)] = updatedSubmission;
        writes[submissionInboxPath(eventId, submission.inboxKey)] = inboxRecord(submission, {
          status: nextStatus,
          guestId: null,
        });
      }
      continue;
    }

    const guest = candidates[0];
    if (guest.associationSource === 'manual' && guest.submissionId !== submission.submissionId) continue;
    if (guest.submissionId && guest.updatedAt >= submission.updatedAt) continue;

    const updatedGuest = {
      ...guest,
      status: submission.decision,
      submissionId: submission.submissionId,
      updatedAt: submission.updatedAt,
      decision: submission.decision,
      associationSource: 'automatic',
    };
    if (submission.companions?.length) updatedGuest.companions = submission.companions;
    else delete updatedGuest.companions;
    const updatedSubmission = capabilityRecord(submission, { status: 'matched', guestId: guest.guestId });
    nextGuests.set(updatedGuest.guestId, updatedGuest);
      writes[guestSlotPath(eventId, guest.slot)] = storedGuest(updatedGuest);
    writes[editCapabilityPath(submission.token)] = updatedSubmission;
    writes[submissionInboxPath(eventId, submission.inboxKey)] = inboxRecord(submission, {
      status: 'matched',
      guestId: guest.guestId,
    });
  }

  if (Object.keys(writes).length > 0) await update(ref(db), writes);
}

export async function associateInboxSubmission(eventId, submission, guest) {
  if (guest.submissionId && guest.submissionId !== submission.submissionId) {
    throw new Error('Este convidado já possui outra resposta. Desfaça essa associação primeiro.');
  }
  const db = database();
  const associatedGuest = {
    ...storedGuest(guest),
    associationSource: 'manual',
    status: submission.decision,
    submissionId: submission.submissionId,
    updatedAt: submission.updatedAt,
    decision: submission.decision,
  };
  if (submission.companions?.length) associatedGuest.companions = submission.companions;
  else delete associatedGuest.companions;

  const writes = {
    [guestSlotPath(eventId, guest.slot)]: associatedGuest,
    [editCapabilityPath(submission.token)]: capabilityRecord(submission, {
      status: 'matched',
      guestId: guest.guestId,
      previousGuestId: null,
      reviewRequired: null,
    }),
    [submissionInboxPath(eventId, submission.inboxKey)]: inboxRecord(submission, {
      status: 'matched',
      guestId: guest.guestId,
      previousGuestId: null,
      reviewRequired: null,
    }),
  };

  const previousGuestId = submission.guestId ?? submission.previousGuestId;
  if (previousGuestId && previousGuestId !== guest.guestId) {
    const previousGuest = await getGuestById(eventId, previousGuestId);
    if (previousGuest?.submissionId === submission.submissionId) {
      const pendingGuest = {
        ...storedGuest(previousGuest),
        status: 'pending',
        submissionId: null,
        updatedAt: null,
        decision: null,
      };
      delete pendingGuest.companions;
      delete pendingGuest.associationSource;
      writes[guestSlotPath(eventId, previousGuest.slot)] = pendingGuest;
    }
  }

  await update(ref(db), writes);
}

export async function detachInboxSubmission(eventId, submission) {
  const changes = {
    status: 'unmatched',
    guestId: null,
    previousGuestId: null,
    reviewRequired: true,
  };
  const writes = {
    [editCapabilityPath(submission.token)]: capabilityRecord(submission, changes),
    [submissionInboxPath(eventId, submission.inboxKey)]: inboxRecord(submission, {
      status: 'unmatched',
      guestId: null,
    }),
  };
  const previousGuestId = submission.guestId ?? submission.previousGuestId;
  if (previousGuestId) {
    const guest = await getGuestById(eventId, previousGuestId);
    if (guest?.submissionId === submission.submissionId) {
      const pendingGuest = {
        ...storedGuest(guest),
        status: 'pending',
        submissionId: null,
        updatedAt: null,
        decision: null,
      };
      delete pendingGuest.companions;
      delete pendingGuest.associationSource;
      writes[guestSlotPath(eventId, guest.slot)] = pendingGuest;
    }
  }
  await update(ref(database()), writes);
}

async function getGuestById(eventId, guestId) {
  const snapshot = await get(ref(database(), rosterPath(eventId)));
  const entry = Object.entries(snapshot.val() ?? {}).find(([, guest]) => guest.guestId === guestId);
  return entry ? { ...entry[1], slot: entry[0] } : null;
}

export async function deleteInboxSubmission(eventId, submission) {
  await update(ref(database()), {
    [submissionInboxPath(eventId, submission.inboxKey)]: null,
    [editCapabilityPath(submission.token)]: null,
  });
}

export async function reissueEditLink(eventId, submission) {
  const db = database();
  const token = makeEditToken();
  const timestamp = Date.now();
  const currentCapability = capabilityRecord(submission, { updatedAt: timestamp });
  const revokedCapability = { ...currentCapability, revokedAt: timestamp };
  delete currentCapability.revokedAt;

  await update(ref(db), {
    [editCapabilityPath(submission.token)]: revokedCapability,
    [editCapabilityPath(token)]: currentCapability,
    [submissionInboxPath(eventId, submission.inboxKey)]: inboxRecord(submission, { token }),
  });

  return `/edit/${token}`;
}