import { describe, expect, it } from 'vitest';
import { confirmedParticipants, topLevelGuests } from '../../src/features/guests/participantList.js';

describe('linked companion roster projection', () => {
  const guests = [
    {
      guestId: 'principal', name: 'Alex Silva', status: 'confirmed', updatedAt: 10,
      companions: [{ name: 'Bento Silva', age: 7 }],
    },
    {
      guestId: 'child', name: 'Bento Silva', status: 'confirmed', guestRole: 'companion',
      companionOfGuestId: 'principal', companionOfSubmissionId: 'submission', companionAge: 7,
    },
  ];

  it('counts and exports a linked child exactly once as part of the principal RSVP', () => {
    expect(confirmedParticipants(guests)).toHaveLength(2);
    expect(confirmedParticipants(guests).map(({ name }) => name)).toEqual(['Alex Silva', 'Bento Silva']);
    expect(topLevelGuests(guests).map(({ name }) => name)).toEqual(['Alex Silva']);
  });

  it('recovers linked companion display from the private roster after the principal declines', () => {
    const declined = guests.map((guest) => ({ ...guest, status: 'declined', companions: undefined }));
    expect(topLevelGuests(declined).map(({ name }) => name)).toEqual(['Alex Silva']);
    expect(declined.filter((guest) => guest.status === 'declined')).toHaveLength(2);
  });

  it('excludes inactive guests from active projections and deduplicates linked companions by name and age', () => {
    const active = {
      guestId: 'principal',
      name: 'Alex Silva',
      status: 'confirmed',
      companions: [
        { name: 'Bento Silva', age: 7 },
        { name: 'BENTO  SILVA', age: 7 },
        { name: 'Bento Silva', age: 8 },
      ],
    };
    const roster = [
      active,
      {
        guestId: 'child', name: 'Bento Silva', status: 'confirmed', guestRole: 'companion',
        companionOfGuestId: 'principal', companionOfSubmissionId: 'submission', companionAge: 7,
      },
      { guestId: 'inactive', name: 'Caio Silva', status: 'inactive' },
    ];
    expect(confirmedParticipants(roster).map(({ name, age }) => [name, age])).toEqual([
      ['Alex Silva', ''],
      ['Bento Silva', 7],
      ['Bento Silva', 8],
    ]);
    expect(topLevelGuests(roster).map(({ guestId }) => guestId)).toEqual(['principal']);
  });
});
