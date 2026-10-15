import { get, onValue, push, ref, runTransaction, update } from 'firebase/database';
import { getFirebaseClient } from '../../services/firebase/client.js';
import { editCapabilityPath, inboxPath, inactiveGuestsPath, rosterPath } from '../../services/firebase/paths.js';
import { normalizeName } from './normalizeName.js';
import { normalizeGuestFields, normalizePhone } from './guestFields.js';
import { guestImportKey, prepareGuestImport } from './guestImport.js';
import { confirmedParticipants, topLevelGuests } from './participantList.js';

export { normalizePhone } from './guestFields.js';

const disabledCapabilityTokens = new Set();
let pendingReconciliationWrite = Promise.resolve();

function database() {
  return getFirebaseClient().database;
}

function guestSlotPath(eventId, slot) {
  return `${rosterPath(eventId)}/${slot}`;
}

function submissionInboxPath(eventId, submissionId) {
  return `${inboxPath(eventId)}/${submissionId}`;
}

function inactiveGuestPath(eventId, guestId) {
  return `${inactiveGuestsPath(eventId)}/${guestId}`;
}

function eventGuestSummary(guests) {
  const primaryGuests = topLevelGuests(guests);

  return {
    pending: primaryGuests.filter((guest) => guest.status === 'pending').length,
    confirmed: confirmedParticipants(guests).length,
    declined: primaryGuests.filter((guest) => guest.status === 'declined').length,
  };
}

export async function getEventGuestSummary(eventId) {
  const snapshot = await get(ref(database(), rosterPath(eventId)));
  const guests = Object.entries(snapshot.val() ?? {}).map(([slot, guest]) => ({ ...guest, slot }));
  return eventGuestSummary(guests);
}

export function listenToEventGuestSummaries(events, onChange) {
  let active = true;
  const stops = events.map((event) => onValue(
    ref(database(), rosterPath(event.id)),
    (snapshot) => {
      if (!active) return;
      const guests = Object.entries(snapshot.val() ?? {}).map(([slot, guest]) => ({ ...guest, slot }));
      onChange(event.id, { state: 'ready', ...eventGuestSummary(guests) });
    },
    (error) => {
      if (active) onChange(event.id, { state: 'error', error });
    },
  ));

  return () => {
    active = false;
    for (const stop of stops) stop();
  };
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
    token: submission.token,
    ...changes,
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

function writeRosterGuest(eventId, guests, writes, guest) {
  guests.set(guest.guestId, guest);
  writes[guestSlotPath(eventId, guest.slot)] = storedGuest(guest);
}

function releaseLinkedCompanions(eventId, submissionId, guests, writes) {
  for (const guest of guests.values()) {
    if (guest.guestRole !== 'companion' || guest.companionOfSubmissionId !== submissionId) continue;
    const pendingGuest = { ...guest, status: 'pending', decision: null };
    delete pendingGuest.guestRole;
    delete pendingGuest.companionOfGuestId;
    delete pendingGuest.companionOfSubmissionId;
    delete pendingGuest.companionAge;
    writeRosterGuest(eventId, guests, writes, pendingGuest);
  }
}

function syncLinkedCompanions(eventId, submission, parent, guests, writes) {
  const linked = [...guests.values()].filter(
    (guest) => guest.guestRole === 'companion' && guest.companionOfSubmissionId === submission.submissionId,
  );
  if (submission.decision === 'declined') {
    for (const guest of linked) {
      if (guest.status !== 'declined' || guest.companionOfGuestId !== parent.guestId) {
        writeRosterGuest(eventId, guests, writes, {
          ...guest,
          status: 'declined',
          decision: 'declined',
          companionOfGuestId: parent.guestId,
        });
      }
    }
    return;
  }

  const companions = Array.isArray(submission.companions)
    ? submission.companions
    : Object.values(submission.companions ?? {});
  const returningFromDeclined = linked.some((guest) => guest.decision === 'declined');
  if (companions.length === 0 && returningFromDeclined) {
    for (const guest of linked) {
      writeRosterGuest(eventId, guests, writes, {
        ...guest,
        status: 'confirmed',
        decision: 'confirmed',
        companionOfGuestId: parent.guestId,
      });
    }
    return;
  }
  const occurrenceCounts = new Map();
  for (const companion of companions) {
    const key = normalizeName(companion.name);
    occurrenceCounts.set(key, (occurrenceCounts.get(key) ?? 0) + 1);
  }
  const companionNames = new Set(occurrenceCounts.keys());

  for (const guest of linked) {
    if (companionNames.has(normalizeName(guest.name))) continue;
    const pendingGuest = { ...guest, status: 'pending', decision: null };
    delete pendingGuest.guestRole;
    delete pendingGuest.companionOfGuestId;
    delete pendingGuest.companionOfSubmissionId;
    delete pendingGuest.companionAge;
    writeRosterGuest(eventId, guests, writes, pendingGuest);
  }

  for (const companion of companions) {
    const key = normalizeName(companion.name);
    if (occurrenceCounts.get(key) !== 1) continue;
    const candidates = [...guests.values()].filter((guest) => (
      guest.guestId !== parent.guestId
      && guest.normalizedName === key
      && (
        guest.guestRole === 'companion'
          ? guest.companionOfSubmissionId === submission.submissionId
          : guest.status === 'pending' && !guest.submissionId
      )
    ));
    if (candidates.length !== 1) continue;
    const matchedCompanion = candidates[0];
    writeRosterGuest(eventId, guests, writes, {
      ...matchedCompanion,
      status: submission.decision,
      decision: submission.decision,
      guestRole: 'companion',
      companionOfGuestId: parent.guestId,
      companionOfSubmissionId: submission.submissionId,
      companionAge: companion.age,
    });
  }
}

export async function saveGuestPhone(eventId, guest, value) {
  const phone = normalizePhone(value);
  await update(ref(database()), {
    [`${guestSlotPath(eventId, guest.slot)}/phone`]: phone || null,
  });
}

export async function updateExpectedGuest(eventId, guest, name, phone) {
  if (!guest?.slot || guest.guestRole === 'companion') {
    throw new Error('Somente convidados principais podem ser editados.');
  }
  const fields = normalizeGuestFields(name, phone);
  await update(ref(database()), {
    [`${guestSlotPath(eventId, guest.slot)}/name`]: fields.name,
    [`${guestSlotPath(eventId, guest.slot)}/normalizedName`]: normalizeName(fields.name),
    [`${guestSlotPath(eventId, guest.slot)}/phone`]: fields.phone || null,
  });
}

function findSubmission(inbox, submissionId) {
  return Object.entries(inbox ?? {}).find(([key, record]) => key === submissionId || record.submissionId === submissionId);
}

function companionKey(companion) {
  return `${normalizeName(companion.name)}\u0000${Number(companion.age)}`;
}

function deduplicateCompanions(companions) {
  const unique = new Map();
  for (const companion of companions) {
    if (!companion || typeof companion.name !== 'string' || !Number.isInteger(Number(companion.age))) {
      throw new Error('Não foi possível mesclar acompanhantes inválidos.');
    }
    const name = companion.name.trim().replace(/\s+/gu, ' ');
    const age = Number(companion.age);
    if (!name || name.length > 100 || age < 0 || age > 120) {
      throw new Error('Não foi possível mesclar acompanhantes inválidos.');
    }
    const normalized = { name, age };
    unique.set(companionKey(normalized), normalized);
  }
  if (unique.size > 20) {
    throw new Error('A mesclagem ultrapassaria o limite de 20 acompanhantes.');
  }
  return [...unique.values()];
}

function companionArchiveRecord(guest, inactiveAt) {
  return {
    guestId: guest.guestId,
    name: guest.name,
    normalizedName: guest.normalizedName,
    status: 'inactive',
    inactiveAt,
    ...(guest.phone && { phone: guest.phone }),
  };
}

export async function deleteExpectedGuest(eventId, guest) {
  if (!guest?.guestId || !guest.slot || guest.guestRole === 'companion') {
    throw new Error('Selecione um convidado principal válido para excluir.');
  }
  const db = database();
  const [rosterSnapshot, inboxSnapshot] = await Promise.all([
    get(ref(db, rosterPath(eventId))),
    get(ref(db, inboxPath(eventId))),
  ]);
  const roster = rosterSnapshot.val() ?? {};
  const currentGuest = roster[guest.slot];
  if (!currentGuest || currentGuest.guestId !== guest.guestId) {
    throw new Error('O convidado não existe mais. Atualize a lista.');
  }
  const inbox = inboxSnapshot.val() ?? {};
  const linkedSubmission = currentGuest.submissionId
    ? findSubmission(inbox, currentGuest.submissionId)
    : null;
  if (currentGuest.submissionId && !linkedSubmission) {
    throw new Error('Não foi possível localizar o RSVP associado. Atualize a lista antes de excluir.');
  }

  const writes = { [guestSlotPath(eventId, guest.slot)]: null };
  if (linkedSubmission) {
    const [submissionId, record] = linkedSubmission;
    if (!record.token) throw new Error('Não foi possível localizar o link de edição associado.');
    writes[submissionInboxPath(eventId, submissionId)] = null;
    writes[editCapabilityPath(record.token)] = null;
  }

  const inactiveAt = Date.now();
  for (const [slot, companion] of Object.entries(roster)) {
    if (
      companion.guestRole !== 'companion'
      || companion.companionOfGuestId !== currentGuest.guestId
      && companion.companionOfSubmissionId !== currentGuest.submissionId
    ) continue;
    writes[guestSlotPath(eventId, slot)] = null;
    writes[inactiveGuestPath(eventId, companion.guestId)] = companionArchiveRecord(companion, inactiveAt);
  }
  if (linkedSubmission) disabledCapabilityTokens.add(linkedSubmission[1].token);
  try {
    await pendingReconciliationWrite;
    await update(ref(db), writes);
  } catch (error) {
    if (linkedSubmission) disabledCapabilityTokens.delete(linkedSubmission[1].token);
    throw error;
  }
}

export async function deleteInactiveGuest(eventId, guest) {
  if (!guest?.guestId) throw new Error('Selecione um acompanhante inativo válido para excluir.');
  await update(ref(database()), {
    [inactiveGuestPath(eventId, guest.guestId)]: null,
  });
}

function comparablePhone(phone) {
  return normalizePhone(phone ?? '').replace(/[^+0-9]/gu, '');
}

export async function mergeExpectedGuests(eventId, source, target) {
  if (!source?.guestId || !source.slot || !target?.guestId || !target.slot || source.guestId === target.guestId) {
    throw new Error('Selecione dois convidados principais diferentes para mesclar.');
  }
  if (source.guestRole === 'companion' || target.guestRole === 'companion') {
    throw new Error('Somente convidados principais podem ser mesclados.');
  }

  const db = database();
  const [rosterSnapshot, inboxSnapshot] = await Promise.all([
    get(ref(db, rosterPath(eventId))),
    get(ref(db, inboxPath(eventId))),
  ]);
  const roster = rosterSnapshot.val() ?? {};
  const sourceGuest = roster[source.slot];
  const targetGuest = roster[target.slot];
  if (
    !sourceGuest || sourceGuest.guestId !== source.guestId
    || !targetGuest || targetGuest.guestId !== target.guestId
  ) {
    throw new Error('Um dos convidados não existe mais. Atualize a lista.');
  }
  if (sourceGuest.submissionId && targetGuest.submissionId) {
    throw new Error('Não é possível mesclar convidados que ambos possuem respostas. Resolva os RSVPs primeiro.');
  }
  if (
    comparablePhone(sourceGuest.phone) && comparablePhone(targetGuest.phone)
    && comparablePhone(sourceGuest.phone) !== comparablePhone(targetGuest.phone)
  ) {
    throw new Error('Não é possível mesclar convidados com telefones diferentes. Resolva os telefones primeiro.');
  }

  const inbox = inboxSnapshot.val() ?? {};
  const submissionId = sourceGuest.submissionId ?? targetGuest.submissionId;
  const submissionEntry = submissionId ? findSubmission(inbox, submissionId) : null;
  if (submissionId && !submissionEntry) {
    throw new Error('Não foi possível localizar o RSVP associado. Atualize a lista antes de mesclar.');
  }
  const linkedCompanions = Object.entries(roster).filter(([, item]) => (
    item.guestRole === 'companion'
    && (item.companionOfGuestId === sourceGuest.guestId || item.companionOfGuestId === targetGuest.guestId)
  ));
  let submission = null;
  if (submissionEntry) {
    const [inboxKey, inboxRecordValue] = submissionEntry;
    if (!inboxRecordValue.token) throw new Error('Não foi possível localizar o link de edição associado.');
    const capabilitySnapshot = await get(ref(db, editCapabilityPath(inboxRecordValue.token)));
    if (!capabilitySnapshot.exists()) throw new Error('O link de edição associado não existe mais. Atualize a lista.');
    submission = {
      ...capabilitySnapshot.val(),
      submissionId,
      token: inboxRecordValue.token,
      inboxKey,
      inboxRecord: inboxRecordValue,
    };
  }
  const submissionCompanions = submission?.companions
    ? Array.isArray(submission.companions) ? submission.companions : Object.values(submission.companions)
    : [];
  const mergedCompanions = submission
    ? deduplicateCompanions([
        ...submissionCompanions,
        ...linkedCompanions.map(([, item]) => ({ name: item.name, age: item.companionAge })),
      ])
    : [];
  const mergedGuest = {
    ...targetGuest,
    ...(targetGuest.phone ? {} : sourceGuest.phone ? { phone: sourceGuest.phone } : {}),
  };
  if (submission) {
    mergedGuest.status = submission.decision;
    mergedGuest.submissionId = submission.submissionId;
    mergedGuest.updatedAt = submission.updatedAt;
    mergedGuest.decision = submission.decision;
    if (sourceGuest.submissionId) {
      mergedGuest.associationSource = sourceGuest.associationSource ?? 'manual';
    }
    if (mergedCompanions.length) mergedGuest.companions = mergedCompanions;
    else delete mergedGuest.companions;
  }

  const writes = {
    [guestSlotPath(eventId, source.slot)]: null,
    [guestSlotPath(eventId, target.slot)]: mergedGuest,
  };
  if (submission) {
    const updated = capabilityRecord(submission, { guestId: targetGuest.guestId });
    if (mergedCompanions.length) updated.companions = mergedCompanions;
    else delete updated.companions;
    writes[editCapabilityPath(submission.token)] = updated;
    writes[submissionInboxPath(eventId, submission.inboxKey)] = inboxRecord(submission, {
      guestId: targetGuest.guestId,
      companions: mergedCompanions.length ? mergedCompanions : null,
    });
  }

  if (submission) {
    const companionKeys = new Set(mergedCompanions.map(companionKey));
    const retainedKeys = new Set();
    for (const [slot, companion] of linkedCompanions) {
      const key = companionKey({ name: companion.name, age: companion.companionAge });
      if (!companionKeys.has(key) || retainedKeys.has(key)) {
        writes[guestSlotPath(eventId, slot)] = null;
        continue;
      }
      retainedKeys.add(key);
      writes[guestSlotPath(eventId, slot)] = {
        ...companion,
        status: submission.decision,
        decision: submission.decision,
        companionOfGuestId: targetGuest.guestId,
        companionOfSubmissionId: submission.submissionId,
      };
    }
  }
  await update(ref(db), writes);
}

export async function removeGuestCompanion(eventId, guest, removedCompanion) {
  if (!guest?.slot || !guest.submissionId || !removedCompanion || typeof removedCompanion.name !== 'string') {
    throw new Error('Selecione um acompanhante válido para excluir.');
  }
  const db = database();
  const [rosterSnapshot, inboxSnapshot] = await Promise.all([
    get(ref(db, rosterPath(eventId))),
    get(ref(db, inboxPath(eventId))),
  ]);
  const roster = rosterSnapshot.val() ?? {};
  const currentGuest = roster[guest.slot];
  const inbox = inboxSnapshot.val() ?? {};
  const submissionEntry = findSubmission(inbox, guest.submissionId);
  if (!currentGuest || currentGuest.guestId !== guest.guestId || !submissionEntry) {
    throw new Error('A resposta do convidado não existe mais. Atualize a lista.');
  }
  const [submissionId, record] = submissionEntry;
  if (!record.token) throw new Error('Não foi possível localizar o link de edição associado.');
  const currentCompanions = record.companions
    ? Array.isArray(record.companions) ? record.companions : Object.values(record.companions)
    : [];
  const companionIndex = currentCompanions.findIndex((item) => companionKey(item) === companionKey(removedCompanion));
  const remaining = companionIndex < 0
    ? currentCompanions
    : currentCompanions.filter((_, index) => index !== companionIndex);
  const writes = {};
  if (companionIndex >= 0) {
    writes[guestSlotPath(eventId, guest.slot) + '/companions'] = remaining.length ? remaining : null;
    writes[editCapabilityPath(record.token) + '/companions'] = remaining.length ? remaining : null;
    writes[submissionInboxPath(eventId, submissionId) + '/companions'] = remaining.length ? remaining : null;
  }
  for (const [slot, companion] of Object.entries(roster)) {
    if (
      companion.guestRole === 'companion'
      && companion.companionOfGuestId === currentGuest.guestId
      && companion.companionOfSubmissionId === submissionId
      && companionKey({ name: companion.name, age: companion.companionAge }) === companionKey(removedCompanion)
    ) writes[guestSlotPath(eventId, slot)] = null;
  }
  if (Object.keys(writes).length === 0) {
    throw new Error('O acompanhante não existe mais. Atualize a lista.');
  }
  await update(ref(db), writes);
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
  let inactiveGuests = {};
  let inbox = {};
  let active = true;
  const submissions = new Map();
  const capabilityListeners = new Map();
  const initialLoads = new Set(['guests', 'inactiveGuests', 'inbox']);
  const pendingCapabilities = new Set();
  const errors = new Map();

  function publish() {
    if (!active) return;
    onChange({
      eventId,
      guests: Object.entries(guests).map(([slot, guest]) => ({ ...guest, slot })),
      inactiveGuests: Object.values(inactiveGuests),
      submissions: [...submissions.values()],
      error: errors.values().next().value,
      ready: errors.size === 0 && initialLoads.size === 0 && pendingCapabilities.size === 0,
    });
  }

  const stopGuests = onValue(ref(db, rosterPath(eventId)), (snapshot) => {
    guests = snapshot.val() ?? {};
    initialLoads.delete('guests');
    errors.delete('guests');
    publish();
  }, (error) => {
    errors.set('guests', error);
    publish();
  });

  const stopInactiveGuests = onValue(ref(db, inactiveGuestsPath(eventId)), (snapshot) => {
    inactiveGuests = snapshot.val() ?? {};
    initialLoads.delete('inactiveGuests');
    errors.delete('inactiveGuests');
    publish();
  }, (error) => {
    errors.set('inactiveGuests', error);
    publish();
  });

  const stopInbox = onValue(ref(db, inboxPath(eventId)), (snapshot) => {
    inbox = snapshot.val() ?? {};
    const activeIds = new Set(Object.keys(inbox));

    for (const [submissionId, listener] of capabilityListeners) {
      if (!activeIds.has(submissionId)) {
        listener.stop();
        capabilityListeners.delete(submissionId);
        submissions.delete(submissionId);
        pendingCapabilities.delete(submissionId);
        errors.delete(`capability:${submissionId}`);
      }
    }

    for (const [submissionId, inboxRecordValue] of Object.entries(inbox)) {
      const token = inboxRecordValue.token;
      const existing = capabilityListeners.get(submissionId);
      if (existing?.token === token) continue;
      existing?.stop();
      pendingCapabilities.delete(submissionId);
      errors.delete(`capability:${submissionId}`);
      pendingCapabilities.add(submissionId);

      let initialCapabilityLoaded = false;
      const listener = { token, stop: () => {} };
      capabilityListeners.set(submissionId, listener);
      const stop = onValue(ref(db, editCapabilityPath(token)), (capabilitySnapshot) => {
        if (!active || capabilityListeners.get(submissionId)?.token !== token) return;
        if (!initialCapabilityLoaded) {
          initialCapabilityLoaded = true;
          pendingCapabilities.delete(submissionId);
        }
        errors.delete(`capability:${submissionId}`);
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
      }, (error) => {
        if (!active || capabilityListeners.get(submissionId)?.token !== token) return;
        pendingCapabilities.delete(submissionId);
        errors.set(`capability:${submissionId}`, error);
        publish();
      });
      listener.stop = stop;
    }
    initialLoads.delete('inbox');
    errors.delete('inbox');
    publish();
  }, (error) => {
    errors.set('inbox', error);
    publish();
  });

  return () => {
    active = false;
    stopGuests();
    stopInactiveGuests();
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
    if (submission.revokedAt || disabledCapabilityTokens.has(submission.token)) continue;
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
        releaseLinkedCompanions(eventId, submission.submissionId, nextGuests, writes);
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
        writeRosterGuest(eventId, nextGuests, writes, updatedGuest);
      }
      syncLinkedCompanions(eventId, submission, matchedGuest, nextGuests, writes);
      continue;
    }

    const candidates = [...nextGuests.values()].filter(
        (guest) => guest.guestRole !== 'companion'
          && guest.normalizedName === normalizeName(submission.name),
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
    writeRosterGuest(eventId, nextGuests, writes, updatedGuest);
    syncLinkedCompanions(eventId, submission, updatedGuest, nextGuests, writes);
    writes[editCapabilityPath(submission.token)] = updatedSubmission;
    writes[submissionInboxPath(eventId, submission.inboxKey)] = inboxRecord(submission, {
      status: 'matched',
      guestId: guest.guestId,
    });
  }

  if (Object.keys(writes).length > 0) {
    const write = pendingReconciliationWrite.then(() => update(ref(db), writes));
    pendingReconciliationWrite = write.catch(() => {});
    await write;
  }
}

export async function associateInboxSubmission(eventId, submission, guest) {
  if (guest.submissionId && guest.submissionId !== submission.submissionId) {
    throw new Error('Este convidado já possui outra resposta. Desfaça essa associação primeiro.');
  }
  const db = database();
  const rosterSnapshot = await get(ref(db, rosterPath(eventId)));
  const rosterEntries = Object.entries(rosterSnapshot.val() ?? {});
  const nextGuests = new Map(rosterEntries.map(([slot, item]) => [item.guestId, { ...item, slot }]));
  const currentGuest = nextGuests.get(guest.guestId);
  if (!currentGuest) throw new Error('O convidado selecionado não existe mais. Atualize a lista.');
  if (currentGuest.submissionId && currentGuest.submissionId !== submission.submissionId) {
    throw new Error('Este convidado já possui outra resposta. Desfaça essa associação primeiro.');
  }
  const targetGuest = currentGuest;
  const associatedGuest = {
    ...storedGuest(targetGuest),
    associationSource: 'manual',
    status: submission.decision,
    submissionId: submission.submissionId,
    updatedAt: submission.updatedAt,
    decision: submission.decision,
  };
  if (submission.companions?.length) associatedGuest.companions = submission.companions;
  else delete associatedGuest.companions;

  const writes = {
    [guestSlotPath(eventId, targetGuest.slot)]: associatedGuest,
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
  if (previousGuestId && previousGuestId !== targetGuest.guestId) {
    const previousGuest = nextGuests.get(previousGuestId);
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
      nextGuests.set(previousGuestId, pendingGuest);
    }
  }
  releaseLinkedCompanions(eventId, submission.submissionId, nextGuests, writes);

  nextGuests.set(targetGuest.guestId, { ...associatedGuest, slot: targetGuest.slot });
  syncLinkedCompanions(eventId, submission, { ...associatedGuest, slot: targetGuest.slot }, nextGuests, writes);
  await update(ref(db), writes);
}

export async function detachInboxSubmission(eventId, submission) {
  const db = database();
  const rosterSnapshot = await get(ref(db, rosterPath(eventId)));
  const nextGuests = new Map(Object.entries(rosterSnapshot.val() ?? {}).map(([slot, guest]) => [
    guest.guestId, { ...guest, slot },
  ]));
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
    const guest = nextGuests.get(previousGuestId);
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
  releaseLinkedCompanions(eventId, submission.submissionId, nextGuests, writes);
  await update(ref(db), writes);
}

async function getGuestById(eventId, guestId) {
  const snapshot = await get(ref(database(), rosterPath(eventId)));
  const entry = Object.entries(snapshot.val() ?? {}).find(([, guest]) => guest.guestId === guestId);
  return entry ? { ...entry[1], slot: entry[0] } : null;
}

export async function deleteInboxSubmission(eventId, submission) {
  disabledCapabilityTokens.add(submission.token);
  try {
    await pendingReconciliationWrite;
    await update(ref(database()), {
      [submissionInboxPath(eventId, submission.inboxKey)]: null,
      [editCapabilityPath(submission.token)]: null,
    });
  } catch (error) {
    disabledCapabilityTokens.delete(submission.token);
    throw error;
  }
}

export async function reissueEditLink(eventId, submission) {
  const db = database();
  const token = makeEditToken();
  const timestamp = Date.now();
  const currentCapability = capabilityRecord(submission, { updatedAt: timestamp });
  const revokedCapability = { ...currentCapability, revokedAt: timestamp };
  delete currentCapability.revokedAt;

  disabledCapabilityTokens.add(submission.token);
  try {
    await pendingReconciliationWrite;
    await update(ref(db), {
      [editCapabilityPath(submission.token)]: revokedCapability,
      [editCapabilityPath(token)]: currentCapability,
      [submissionInboxPath(eventId, submission.inboxKey)]: inboxRecord(submission, { token }),
    });
  } catch (error) {
    disabledCapabilityTokens.delete(submission.token);
    throw error;
  }

  return `/edit/${token}`;
}