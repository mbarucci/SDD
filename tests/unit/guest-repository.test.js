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

import { associateInboxSubmission, detachInboxSubmission, normalizePhone, reconcileEventInbox, saveGuestPhone } from '../../src/features/guests/guestRepository.js';

describe('associateInboxSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get.mockResolvedValue({
      val: () => ({
        'guest-001': {
          guestId: 'old-guest',
          name: 'Alex Silva',
          normalizedName: 'alex silva',
          status: 'confirmed',
          submissionId: 'submission-1',
          updatedAt: 1234,
          companions: [{ name: 'Caio', age: 7 }],
        },
        'guest-002': {
          guestId: 'new-guest',
          name: 'Beatriz Lima',
          normalizedName: 'beatriz lima',
          status: 'pending',
          phone: '+55 (11) 99999-0000',
          companions: [{ name: 'João', age: 8 }],
        },
      }),
    });

  });

    it('moves an already matched response and releases the previous guest', async () => {
      await associateInboxSubmission('event-1', {
        token: 'token-1', inboxKey: 'submission-1', submissionId: 'submission-1',
        guestId: 'old-guest', name: 'Alex Silva', decision: 'confirmed',
        updatedAt: 1234, status: 'matched', companions: [{ name: 'Caio', age: 7 }],
      }, {
        guestId: 'new-guest', slot: 'guest-002', name: 'Beatriz',
        normalizedName: 'beatriz', status: 'pending', phone: '+55 (11) 99999-0000',
      });
      const writes = update.mock.calls[0][1];
      expect(writes['privateEvents/event-1/guests/guest-001']).toMatchObject({ status: 'pending', submissionId: null });
      expect(writes['privateEvents/event-1/guests/guest-002']).toMatchObject({
        phone: '+55 (11) 99999-0000', companions: [{ name: 'Caio', age: 7 }],
      });
    });

    it('keeps a manually detached response in review even when the name matches', async () => {
      const submission = {
        token: 'token-1', inboxKey: 'submission-1', submissionId: 'submission-1',
        guestId: 'old-guest', name: 'Alex Silva', decision: 'confirmed',
        updatedAt: 1234, status: 'matched',
      };
      await detachInboxSubmission('event-1', submission);
      const writes = update.mock.calls[0][1];
      const detached = writes['publicEditCapabilities/token-1'];
      expect(detached).toMatchObject({ status: 'unmatched', reviewRequired: true, guestId: null });
      expect(writes['privateEvents/event-1/guests/guest-001']).toMatchObject({ status: 'pending' });
      update.mockClear();
      await reconcileEventInbox('event-1', [{
        guestId: 'old-guest', slot: 'guest-001', name: 'Alex Silva',
        normalizedName: 'alex silva', status: 'pending',
      }], [{ ...detached, token: 'token-1', inboxKey: 'submission-1' }]);
      expect(update).not.toHaveBeenCalled();
    });

    it('does not overwrite another response when selecting an occupied guest', async () => {
      await expect(associateInboxSubmission('event-1', {
        submissionId: 'submission-1',
      }, { submissionId: 'other-response' })).rejects.toThrow('já possui');
      expect(update).not.toHaveBeenCalled();
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
      companions: [{ name: 'Caio', age: 7 }],
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
    expect(writes['privateEvents/event-1/guests/guest-002']).toMatchObject({
      guestId: 'new-guest',
      companions: [{ name: 'Caio', age: 7 }],
    });
    expect(writes).not.toHaveProperty('privateEvents/event-1/guests/undefined');
  });

    it('does not replace a manually linked guest with a newer name match', async () => {
      await reconcileEventInbox('event-1', [{
        guestId: 'guest-1', slot: 'guest-001', name: 'Alex Silva', normalizedName: 'alex silva',
        status: 'confirmed', submissionId: 'manual-response', associationSource: 'manual', updatedAt: 100,
      }], [{
        name: 'Alex Silva', status: 'unmatched', submissionId: 'new-response',
        token: 'token-2', inboxKey: 'new-response', decision: 'confirmed', updatedAt: 200,
      }]);
      expect(update).not.toHaveBeenCalled();
    });

    it('validates optional phones and edits only the private phone field', async () => {
      expect(normalizePhone()).toBe('');
      expect(normalizePhone(' +55 (11) 09999-0000 ')).toBe('+55 (11) 09999-0000');
      expect(() => normalizePhone('sem telefone')).toThrow('telefone válido');
      expect(() => normalizePhone('1'.repeat(41))).toThrow('telefone válido');
      await saveGuestPhone('event-1', { slot: 'guest-001' }, '');
      expect(update).toHaveBeenCalledWith({}, {
        'privateEvents/event-1/guests/guest-001/phone': null,
      });
    });

  it('clears stale companions from both guests when reassociating without companions', async () => {
    await associateInboxSubmission('event-1', {
      token: 'token-2',
      inboxKey: 'submission-1',
      submissionId: 'submission-1',
      name: 'Alex Souza',
      normalizedName: 'alex souza',
      decision: 'confirmed',
      message: '',
      updatedAt: 2345,
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
      companions: [{ name: 'João', age: 8 }],
    });

    const writes = update.mock.calls[0][1];
    expect(writes['privateEvents/event-1/guests/guest-001']).not.toHaveProperty('companions');
    expect(writes['privateEvents/event-1/guests/guest-002']).not.toHaveProperty('companions');
  });
});