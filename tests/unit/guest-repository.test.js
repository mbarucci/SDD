import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, onValue, update } = vi.hoisted(() => ({
  get: vi.fn(),
  onValue: vi.fn(),
  update: vi.fn(),
}));

vi.mock('firebase/database', () => ({
  get,
  onValue,
  ref: (_database, path) => ({ path }),
  update,
}));

vi.mock('../../src/services/firebase/client.js', () => ({
  getFirebaseClient: () => ({ database: {} }),
}));

import {
  associateInboxSubmission,
  deleteExpectedGuest,
  deleteInactiveGuest,
  detachInboxSubmission,
  getEventGuestSummary,
  listenToEventGuestSummaries,
  listenToEventManagement,
  mergeExpectedGuests,
  normalizePhone,
  reconcileEventInbox,
  removeGuestCompanion,
  reissueEditLink,
  saveGuestPhone,
  updateExpectedGuest,
} from '../../src/features/guests/guestRepository.js';

describe('event management loading state', () => {
  it('becomes ready only after the current event snapshots load and stops every listener', () => {
    const listeners = new Map();
    const stops = [];
    onValue.mockImplementation((target, onChange, onError) => {
      const stop = vi.fn();
      listeners.set(target.path, { onChange, onError });
      stops.push(stop);
      return stop;
    });
    const onState = vi.fn();

    const stop = listenToEventManagement('event-1', onState);
    expect(onState).not.toHaveBeenCalled();

    listeners.get('privateEvents/event-1/guests').onChange({ val: () => null });
    expect(onState).toHaveBeenLastCalledWith(expect.objectContaining({
      eventId: 'event-1',
      guests: [],
      ready: false,
    }));
    listeners.get('privateEvents/event-1/inactiveGuests').onChange({ val: () => null });
    listeners.get('privateEvents/event-1/inbox').onChange({ val: () => null });
    expect(onState).toHaveBeenLastCalledWith(expect.objectContaining({
      eventId: 'event-1',
      ready: true,
    }));

    stop();
    expect(stops).toHaveLength(3);
    for (const stopListener of stops) expect(stopListener).toHaveBeenCalledOnce();
  });

  it('exposes listener errors instead of presenting an empty ready roster', () => {
    const listeners = new Map();
    onValue.mockImplementation((target, onChange, onError) => {
      listeners.set(target.path, { onChange, onError });
      return vi.fn();
    });
    const onState = vi.fn();
    listenToEventManagement('event-1', onState);
    const error = new Error('permission denied');

    listeners.get('privateEvents/event-1/guests').onError(error);

    expect(onState).toHaveBeenLastCalledWith(expect.objectContaining({
      error,
      ready: false,
    }));
  });
});

describe('event list summary listeners', () => {
  it('loads one summary per listed event and stops them all when leaving the list', () => {
    const listeners = new Map();
    const stops = [];
    onValue.mockImplementation((target, onChange, onError) => {
      const stop = vi.fn();
      listeners.set(target.path, { onChange, onError });
      stops.push(stop);
      return stop;
    });
    const onSummary = vi.fn();
    const stop = listenToEventGuestSummaries([{ id: 'event-1' }, { id: 'event-2' }], onSummary);

    listeners.get('privateEvents/event-1/guests').onChange({
      val: () => ({ guest: { guestId: 'guest-1', name: 'Ana', status: 'pending' } }),
    });
    listeners.get('privateEvents/event-2/guests').onChange({
      val: () => ({ guest: { guestId: 'guest-2', name: 'Bia', status: 'declined' } }),
    });

    expect(onSummary).toHaveBeenNthCalledWith(1, 'event-1', {
      state: 'ready', pending: 1, confirmed: 0, declined: 0,
    });
    expect(onSummary).toHaveBeenNthCalledWith(2, 'event-2', {
      state: 'ready', pending: 0, confirmed: 0, declined: 1,
    });
    stop();
    expect(stops).toHaveLength(2);
    for (const stopListener of stops) expect(stopListener).toHaveBeenCalledOnce();
  });
});

describe('event response summary', () => {
  it('counts active pending/declined guests and confirmed participants including linked companions', async () => {
    get.mockResolvedValue({
      val: () => ({
        principal: {
          guestId: 'principal',
          name: 'Ana',
          status: 'confirmed',
          companions: [{ name: 'Bia', age: 7 }],
        },
        companion: {
          guestId: 'companion',
          name: 'Bia',
          status: 'confirmed',
          guestRole: 'companion',
          companionOfGuestId: 'principal',
          companionAge: 7,
        },
        pending: { guestId: 'pending', name: 'Caio', status: 'pending' },
        declined: { guestId: 'declined', name: 'Duda', status: 'declined' },
        inactive: { guestId: 'inactive', name: 'Eva', status: 'inactive' },
      }),
    });

    await expect(getEventGuestSummary('event-1')).resolves.toEqual({
      pending: 1,
      confirmed: 2,
      declined: 1,
    });
  });
});

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

  it('edits only a guest name and phone', async () => {
    await updateExpectedGuest('event-1', { slot: 'guest-001' }, 'Alex Souza', '+55 (11) 90000-0000');

    expect(update.mock.calls[0][1]).toEqual({
      'privateEvents/event-1/guests/guest-001/name': 'Alex Souza',
      'privateEvents/event-1/guests/guest-001/normalizedName': 'alex souza',
      'privateEvents/event-1/guests/guest-001/phone': '+55 (11) 90000-0000',
    });
  });

  it('deletes the RSVP and edit capability while archiving linked companions as inactive', async () => {
    get.mockResolvedValueOnce({
      val: () => ({
        'guest-001': {
          guestId: 'principal', name: 'Alex Silva', normalizedName: 'alex silva',
          status: 'confirmed', submissionId: 'submission-1', slot: 'guest-001',
        },
        'guest-002': {
          guestId: 'child', name: 'Bento Silva', normalizedName: 'bento silva',
          status: 'confirmed', guestRole: 'companion', companionOfGuestId: 'principal',
          companionOfSubmissionId: 'submission-1', companionAge: 7, slot: 'guest-002',
        },
      }),
    });
    get.mockResolvedValueOnce({
      val: () => ({ 'submission-1': { token: 'token-1' } }),
    });

    await deleteExpectedGuest('event-1', { guestId: 'principal', slot: 'guest-001' });

    const writes = update.mock.calls[0][1];
    expect(writes['privateEvents/event-1/guests/guest-001']).toBeNull();
    expect(writes['privateEvents/event-1/guests/guest-002']).toBeNull();
    expect(writes['privateEvents/event-1/inactiveGuests/child']).toMatchObject({
      guestId: 'child', name: 'Bento Silva', normalizedName: 'bento silva',
      status: 'inactive', inactiveAt: expect.any(Number),
    });
    expect(writes['privateEvents/event-1/inbox/submission-1']).toBeNull();
    expect(writes['publicEditCapabilities/token-1']).toBeNull();
  });

  it('blocks merging guests with two RSVPs or conflicting non-empty phones before writing', async () => {
    get.mockResolvedValueOnce({
      val: () => ({
        'guest-001': { guestId: 'source', name: 'Alex', normalizedName: 'alex', status: 'confirmed', submissionId: 'one' },
        'guest-002': { guestId: 'target', name: 'Alex S.', normalizedName: 'alex s', status: 'confirmed', submissionId: 'two' },
      }),
    });
    await expect(mergeExpectedGuests('event-1', { guestId: 'source', slot: 'guest-001' }, { guestId: 'target', slot: 'guest-002' }))
      .rejects.toThrow('ambos possuem respostas');
    expect(update).not.toHaveBeenCalled();

    get.mockResolvedValueOnce({
      val: () => ({
        'guest-001': { guestId: 'source', name: 'Alex', normalizedName: 'alex', status: 'pending', phone: '111' },
        'guest-002': { guestId: 'target', name: 'Alex S.', normalizedName: 'alex s', status: 'pending', phone: '222' },
      }),
    });
    await expect(mergeExpectedGuests('event-1', { guestId: 'source', slot: 'guest-001' }, { guestId: 'target', slot: 'guest-002' }))
      .rejects.toThrow('telefones diferentes');
    expect(update).not.toHaveBeenCalled();
  });

  it('deduplicates companions when merging and removes a companion from both RSVP and linked roster', async () => {
    const source = {
      guestId: 'source', name: 'Alex Silva', normalizedName: 'alex silva', status: 'confirmed',
      submissionId: 'submission-1', updatedAt: 200, companions: [{ name: 'Bento Silva', age: 7 }],
    };
    const target = {
      guestId: 'target', name: 'Alex Silva Jr', normalizedName: 'alex silva jr', status: 'pending',
    };
    get.mockResolvedValueOnce({
      val: () => ({
        'guest-001': source,
        'guest-002': target,
        'guest-003': {
          guestId: 'child', name: 'Bento Silva', normalizedName: 'bento silva',
          status: 'confirmed', guestRole: 'companion', companionOfGuestId: 'source',
          companionOfSubmissionId: 'submission-1', companionAge: 7,
        },
      }),
    });
    get.mockResolvedValueOnce({
      val: () => ({ 'submission-1': { token: 'token-1' } }),
    });
    get.mockResolvedValueOnce({
      exists: () => true,
      val: () => ({
        eventId: 'event-1', submissionId: 'submission-1', token: 'token-1',
        name: 'Alex Silva', decision: 'confirmed', message: '',
        updatedAt: 200, companions: [{ name: 'Bento Silva', age: 7 }],
      }),
    });

    await mergeExpectedGuests('event-1', { ...source, slot: 'guest-001' }, { ...target, slot: 'guest-002' });
    const mergeWrites = update.mock.calls[0][1];
    expect(mergeWrites['privateEvents/event-1/guests/guest-001']).toBeNull();
    expect(mergeWrites['privateEvents/event-1/guests/guest-002']).toMatchObject({
      guestId: 'target', submissionId: 'submission-1',
      companions: [{ name: 'Bento Silva', age: 7 }],
    });
    expect(mergeWrites['privateEvents/event-1/guests/guest-003']).toMatchObject({
      companionOfGuestId: 'target',
    });

    get.mockResolvedValueOnce({
      val: () => ({
        'guest-002': { ...target, slot: 'guest-002', submissionId: 'submission-1' },
        'guest-003': {
          guestId: 'child', name: 'Bento Silva', normalizedName: 'bento silva',
          guestRole: 'companion', companionOfGuestId: 'target',
          companionOfSubmissionId: 'submission-1', companionAge: 7,
        },
      }),
    });
    get.mockResolvedValueOnce({
      val: () => ({ 'submission-1': { token: 'token-1', companions: [{ name: 'Bento Silva', age: 7 }] } }),
    });
    await removeGuestCompanion(
      'event-1',
      { guestId: 'target', slot: 'guest-002', submissionId: 'submission-1' },
      { name: 'Bento Silva', age: 7 },
    );
    const removeWrites = update.mock.calls[1][1];
    expect(removeWrites['privateEvents/event-1/guests/guest-003']).toBeNull();
    expect(removeWrites['privateEvents/event-1/guests/guest-002/companions']).toBeNull();
  });

  it('deletes one inactive companion record', async () => {
    await deleteInactiveGuest('event-1', { guestId: 'child' });
    expect(update).toHaveBeenCalledWith({}, {
      'privateEvents/event-1/inactiveGuests/child': null,
    });
  });

  it('reissues an edit link atomically and prevents stale reconciliation from restoring the old token', async () => {
    const submission = {
      eventId: 'event-1',
      submissionId: 'submission-1',
      token: 'old-token',
      inboxKey: 'submission-1',
      name: 'Alex Silva',
      decision: 'confirmed',
      message: '',
      createdAt: 100,
      updatedAt: 200,
      status: 'matched',
      guestId: 'guest-1',
      inboxRecord: { token: 'old-token', createdAt: 100 },
    };
    const newLink = await reissueEditLink('event-1', submission);
    const newToken = newLink.slice('/edit/'.length);
    const writes = update.mock.calls[0][1];
    expect(writes['publicEditCapabilities/old-token']).toMatchObject({ revokedAt: expect.any(Number) });
    expect(writes[`publicEditCapabilities/${newToken}`]).toMatchObject({ eventId: 'event-1', submissionId: 'submission-1' });
    expect(writes['privateEvents/event-1/inbox/submission-1'].token).toBe(newToken);

    update.mockClear();
    await reconcileEventInbox('event-1', [], [submission]);
    expect(update).not.toHaveBeenCalled();
  });
});