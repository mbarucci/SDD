import { describe, expect, it } from 'vitest';
import { normalizeName } from '../../src/features/guests/normalizeName.js';

describe('normalizeName', () => {
  it('normalizes case and repeated surrounding whitespace', () => {
    expect(normalizeName('  MARIA   da  Silva  ')).toBe('maria da silva');
  });

  it('treats canonically equivalent Unicode spellings as equal', () => {
    expect(normalizeName('Jose\u0301')).toBe(normalizeName('José'));
  });

  it('preserves accents and punctuation', () => {
    expect(normalizeName('Ana-María, Jr.!')).toBe('ana-maría, jr.!');
  });
});