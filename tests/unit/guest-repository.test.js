import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, update } = vi.hoisted(() => ({
  get: vi.fn(),
  update: vi.fn(),
}));

vi.mock('firebase/database', () => ({
  get,
  ref: (_database, path) => ({ path }),
  update,
}));

vi.mock('../../src/services/firebase/client.js', () => ({
  getFirebaseClient: () => ({ database: {} }),
}));

import { associateInboxSubmission } from '../../src/features/guests/guestRepository.js';

describe('associateInboxSubmission', () => {
  beforeEach(() => {
    get.mockResolvedValue({
      val: () => ({
        'guest-001': {
          guestId: 'old-guest',
          name: 'Alex Silva',
          normalizedName: 'alex silva',
          status: 'confirmed',
          submissionId: 'submission-1',
          updatedAt: 1234,
        },
      }),
    });
  });

  it('releases the previous guest using its numbered slot', async () => {
    await associateInboxSubmission('event-1', {
      token: 'token-1',
      inboxKey: 'submission-1',
      submissionId: 'submission-1',
      name: 'Alex Souza',
      normalizedName: 'alex souza',
      decision: 'confirmed',
      message: '',
      updatedAt: 1234,
      status: 'unmatched',
      previousGuestId: 'old-guest',
      reviewRequired: true,
      inboxRecord: {},
    }, {
      guestId: 'new-guest',
      slot: 'guest-002',
      name: 'Beatriz Lima',
      normalizedName: 'beatriz lima',
      status: 'pending',
      createdAt: 1000,
    });

    const writes = update.mock.calls[0][1];
    expect(writes['privateEvents/event-1/guests/guest-001']).toMatchObject({
      guestId: 'old-guest',
      status: 'pending',
      submissionId: null,
    });
    expect(writes).not.toHaveProperty('privateEvents/event-1/guests/undefined');
  });
});