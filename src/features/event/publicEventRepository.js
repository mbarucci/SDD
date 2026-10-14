import { get, ref } from 'firebase/database';
import { getFirebaseClient } from '../../services/firebase/client.js';
import { publicEventPath } from '../../services/firebase/paths.js';

export async function getPublishedEvent(eventId) {
  const { database } = getFirebaseClient();
  const snapshot = await get(ref(database, publicEventPath(eventId)));
  if (!snapshot.exists() || snapshot.val().status !== 'published') return null;
  return { ...snapshot.val(), id: eventId };
}