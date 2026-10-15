import { describe, expect, it } from 'vitest';
import { formatRsvpDecision, formatSavedResponseDate } from '../../src/features/rsvp/rsvpPresentation.js';

describe('RSVP presentation', () => {
  it('formats saved timestamps in Brazilian date order', () => {
    expect(formatSavedResponseDate(Date.UTC(2027, 4, 8, 12))).toBe('08/05/2027');
  });

  it('does not invent a date when a timestamp is unavailable', () => {
    expect(formatSavedResponseDate(undefined)).toBe('');
    expect(formatSavedResponseDate('not-a-timestamp')).toBe('');
  });

  it('uses the approved human-readable RSVP decisions', () => {
    expect(formatRsvpDecision('confirmed')).toBe('Vou');
    expect(formatRsvpDecision('declined')).toBe('Não posso');
    expect(formatRsvpDecision('unknown')).toBe('');
  });
});
