import { get, push, ref, set, update } from 'firebase/database';
import { getFirebaseClient } from '../../services/firebase/client.js';
import { privateEventPath, publicEventPath } from '../../services/firebase/paths.js';

function databaseReference(path) {
  return ref(getFirebaseClient().database, path);
}

function publicRecord(event) {
  const { id, ownerUid, ...fields } = event;
  return fields;
}

export async function createEvent(ownerUid, fields) {
  const { database } = getFirebaseClient();
  const eventId = push(ref(database, 'publicEvents')).key;
  if (!eventId) throw new Error('Não foi possível gerar um identificador para o evento.');

  const timestamp = Date.now();
  const event = {
    ...fields,
    id: eventId,
    ownerUid,
    status: 'draft',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await set(ref(database, privateEventPath(eventId)), { ownerUid, createdAt: timestamp });
  await set(ref(database, publicEventPath(eventId)), publicRecord(event));
  await set(ref(database, `hostEventIndex/${ownerUid}/${eventId}`), {
    eventId,
    title: event.title,
    date: event.date,
    time: event.time,
    status: event.status,
  });

  return event;
}

export async function saveEvent(event, publish = false) {
  const { database } = getFirebaseClient();
  const nextEvent = {
    ...event,
    status: publish ? 'published' : 'draft',
    updatedAt: Date.now(),
  };

  await update(ref(database, publicEventPath(event.id)), publicRecord(nextEvent));
  await set(ref(database, `hostEventIndex/${event.ownerUid}/${event.id}`), {
    eventId: event.id,
    title: nextEvent.title,
    date: nextEvent.date,
    time: nextEvent.time,
    status: nextEvent.status,
  });

  return nextEvent;
}

export async function listHostEvents(ownerUid) {
  const indexSnapshot = await get(databaseReference(`hostEventIndex/${ownerUid}`));
  if (!indexSnapshot.exists()) return [];

  const eventIds = Object.keys(indexSnapshot.val());
  const events = await Promise.all(eventIds.map(async (eventId) => {
    const eventSnapshot = await get(databaseReference(publicEventPath(eventId)));
    return eventSnapshot.exists()
      ? { ...eventSnapshot.val(), id: eventId, ownerUid }
      : null;
  }));

  return events.filter(Boolean).sort((left, right) => left.date.localeCompare(right.date));
}

export async function getPublicEvent(eventId) {
  const snapshot = await get(databaseReference(publicEventPath(eventId)));
  return snapshot.exists() ? { ...snapshot.val(), id: eventId } : null;
}