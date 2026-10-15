import { normalizeName } from './normalizeName.js';

export function companionsForGuest(guest, roster = []) {
  const submitted = Array.isArray(guest.companions)
    ? guest.companions
    : Object.values(guest.companions ?? {});
  const linked = roster.filter((item) => (
    item.guestRole === 'companion' && item.companionOfGuestId === guest.guestId
  ));
  const submittedNames = new Set(submitted.map((item) => normalizeName(item.name)));
  return [
    ...submitted,
    ...linked
      .filter((item) => !submittedNames.has(normalizeName(item.name)))
      .map((item) => ({ name: item.name, age: item.companionAge })),
  ];
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
  return guests.filter((guest) => guest.guestRole !== 'companion');
}