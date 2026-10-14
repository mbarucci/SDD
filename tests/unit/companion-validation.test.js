import { describe, expect, it } from 'vitest';
import { normalizeCompanions } from '../../src/features/rsvp/companionValidation.js';

describe('normalizeCompanions', () => {
  it('trims names and converts ages to integers', () => {
    expect(normalizeCompanions([{ name: '  Caio   Silva ', age: '7' }], 'confirmed'))
      .toEqual([{ name: 'Caio Silva', age: 7 }]);
  });

  it('rejects invalid ages, missing names, excessive companions, and declined RSVPs', () => {
    expect(() => normalizeCompanions([{ name: 'Caio', age: 7.5 }], 'confirmed')).toThrow();
    expect(() => normalizeCompanions([{ name: 'Caio', age: '   ' }], 'confirmed')).toThrow();
    expect(() => normalizeCompanions([{ name: ' ', age: 7 }], 'confirmed')).toThrow();
    expect(() => normalizeCompanions(Array.from({ length: 21 }, () => ({ name: 'Pessoa', age: 7 })), 'confirmed'))
      .toThrow();
    expect(() => normalizeCompanions([{ name: 'Caio', age: 7 }], 'declined')).toThrow();
  });
});