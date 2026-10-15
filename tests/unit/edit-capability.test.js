import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, ref, set } = vi.hoisted(() => ({
  get: vi.fn(),
  ref: vi.fn((_database, path) => ({ path })),
  set: vi.fn(),
}));

vi.mock('firebase/database', () => ({ get, ref, set }));
vi.mock('../../src/services/firebase/client.js', () => ({
  getFirebaseClient: () => ({ database: {} }),
}));

import { getEditCapability, saveEditCapability } from '../../src/features/rsvp/editCapabilityService.js';

describe('edit capability revocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not expose a revoked capability to the RSVP editor', async () => {
    get.mockResolvedValue({
      exists: () => true,
      val: () => ({
        eventId: 'event-1',
        submissionId: 'submission-1',
        name: 'Alex Silva',
        revokedAt: 200,
      }),
    });

    await expect(getEditCapability('old-token')).resolves.toBeNull();
  });

  it('refuses to save through a revoked capability', async () => {
    await expect(saveEditCapability({
      eventId: 'event-1',
      submissionId: 'submission-1',
      token: 'old-token',
      revokedAt: 200,
    }, {
      name: 'Alex Souza',
      decision: 'confirmed',
      message: '',
    })).rejects.toThrow('Este link não está mais disponível.');
    expect(set).not.toHaveBeenCalled();
  });
});
