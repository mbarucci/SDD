import { normalizeName } from './normalizeName.js';

function companionKey(companion) {
  return `${normalizeName(companion.name)}\u0000${Number(companion.age)}`;
}

export function companionsForGuest(guest, roster = []) {
  const submitted = Array.isArray(guest.companions)
    ? guest.companions
    : Object.values(guest.companions ?? {});
  const linked = roster.filter((item) => (
    item.guestRole === 'companion' && item.companionOfGuestId === guest.guestId
  ));
  const unique = new Map();
  for (const companion of [...submitted, ...linked.map((item) => ({ name: item.name, age: item.companionAge }))]) {
    const key = companionKey(companion);
    if (!unique.has(key)) unique.set(key, companion);
  }
  return [...unique.values()];
}

export function participantsForGuest(guest, roster = []) {
  return [
    { name: guest.name, age: '', phone: guest.phone ?? '', companionOf: '', updatedAt: guest.updatedAt },
    ...companionsForGuest(guest, roster).map((companion) => ({
      name: companion.name,
      age: companion.age,
      phone: '',
      companionOf: guest.name,
      updatedAt: guest.updatedAt,
    })),
  ];
}

export function confirmedParticipants(guests) {
  return guests
    .filter((guest) => guest.status === 'confirmed' && guest.guestRole !== 'companion')
    .flatMap((guest) => participantsForGuest(guest, guests));
}

export function topLevelGuests(guests) {
  return guests.filter((guest) => guest.guestRole !== 'companion' && guest.status !== 'inactive');
}

export function filterGuestList(guests, { query = '', status = 'all' } = {}) {
  const normalizedQuery = normalizeName(query);
  return guests.filter((guest) => (
    (status === 'all' || guest.status === status)
    && (!normalizedQuery || normalizeName(guest.name).includes(normalizedQuery))
  ));
}