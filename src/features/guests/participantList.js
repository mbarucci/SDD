export function companionsForGuest(guest) {
  return Array.isArray(guest.companions)
    ? guest.companions
    : Object.values(guest.companions ?? {});
}

export function participantsForGuest(guest) {
  return [
    { name: guest.name, age: '', phone: guest.phone ?? '', companionOf: '', updatedAt: guest.updatedAt },
    ...companionsForGuest(guest).map((companion) => ({
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
    .filter((guest) => guest.status === 'confirmed')
    .flatMap((guest) => participantsForGuest(guest));
}