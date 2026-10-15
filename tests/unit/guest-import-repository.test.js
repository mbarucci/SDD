import { beforeEach, describe, expect, it, vi } from 'vitest';

const { runTransaction } = vi.hoisted(() => ({ runTransaction: vi.fn() }));
vi.mock('firebase/database', () => ({
  ref: (_database, path) => ({ path }),
  push: () => ({ key: crypto.randomUUID() }),
  runTransaction,
}));
vi.mock('../../src/services/firebase/client.js', () => ({
  getFirebaseClient: () => ({ database: {} }),
}));
import { importExpectedGuests } from '../../src/features/guests/guestRepository.js';

describe('atomic guest import', () => {
  beforeEach(() => vi.clearAllMocks());

  it('preserves existing responses and rechecks duplicates on transaction retries', async () => {
    const original = {
      'guest-001': { guestId: 'existing', name: 'Alex', phone: '123', status: 'confirmed', companions: [{ name: 'Bento', age: 7 }] },
    };
    let written;
    runTransaction.mockImplementation(async (path, mutate, options) => {
      expect(path.path).toBe('privateEvents/event/guests');
      expect(options).toEqual({ applyLocally: false });
      mutate(null);
      written = mutate(original);
      return { committed: true };
    });
    const result = await importExpectedGuests('event', [
      { name: 'Alex', phone: '123' }, { name: 'Beatriz', phone: '0123456789' },
    ]);
    expect(result).toEqual({ imported: 1, skipped: 1 });
    expect(written['guest-001']).toEqual(original['guest-001']);
    expect(written['guest-002']).toMatchObject({ name: 'Beatriz', phone: '0123456789', status: 'pending' });
  });

  it('aborts the entire import when concurrent registrations consume the remaining slots', async () => {
    runTransaction.mockImplementation(async (_path, mutate) => {
      expect(mutate(Object.fromEntries(Array.from({ length: 99 }, (_, i) => [
        `guest-${String(i + 1).padStart(3, '0')}`, { name: `Convidado ${i}` },
      ])))).toBeUndefined();
      return { committed: false };
    });
    await expect(importExpectedGuests('event', [{ name: 'Alex' }, { name: 'Beatriz' }])).rejects.toThrow('1 vaga');
  });

  it('does not write invalid rows', async () => {
    await expect(importExpectedGuests('event', [{ row: 2, name: 'Alex', phone: 'inválido' }])).rejects.toThrow('Linha 2');
    expect(runTransaction).not.toHaveBeenCalled();
  });
});
