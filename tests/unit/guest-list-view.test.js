import { describe, expect, it } from 'vitest';
import { confirmedParticipants, filterGuestList, topLevelGuests } from '../../src/features/guests/participantList.js';

const roster = [
  { guestId: 'ana', slot: 'guest-001', name: 'Ana Silva', status: 'confirmed', companions: [{ name: 'Bia', age: 7 }] },
  { guestId: 'bia', slot: 'guest-002', name: 'Bia', status: 'confirmed', guestRole: 'companion' },
  { guestId: 'caio', slot: 'guest-003', name: 'Caio Souza', status: 'pending' },
  { guestId: 'duda', slot: 'guest-004', name: 'Duda Lima', status: 'declined' },
];

describe('guest list presentation filter', () => {
  it('normalizes search and applies a status without changing the source roster or participant totals', () => {
    const primaryGuests = topLevelGuests(roster);

    expect(filterGuestList(primaryGuests, { query: '  ANA   SILVA ', status: 'confirmed' })).toEqual([roster[0]]);
    expect(roster).toHaveLength(4);
    expect(confirmedParticipants(roster)).toHaveLength(2);
  });

  it('returns no matches distinctly while preserving the complete guest projection', () => {
    const primaryGuests = topLevelGuests(roster);

    expect(filterGuestList(primaryGuests, { query: 'ninguém', status: 'all' })).toEqual([]);
    expect(filterGuestList(primaryGuests, { query: '', status: 'pending' })).toEqual([roster[2]]);
    expect(primaryGuests.map(({ guestId }) => guestId)).toEqual(['ana', 'caio', 'duda']);
  });
});
