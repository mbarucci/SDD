import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { get, ref, set } from 'firebase/database';

const projectId = 'demo-taskify';
let testEnvironment;

beforeAll(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId,
    database: {
      host: '127.0.0.1',
      port: 9001,
      rules: readFileSync('database.rules.json', 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnvironment.clearDatabase();
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.database();
    await set(ref(database, 'publicEvents/published-event'), { status: 'published', title: 'Festa' });
    await set(ref(database, 'publicEvents/draft-event'), { status: 'draft', title: 'Rascunho' });
    await set(ref(database, 'privateEvents/published-event'), { ownerUid: 'host-one', guests: { guestOne: { name: 'Helena' } } });
    await set(ref(database, 'privateEvents/draft-event'), { ownerUid: 'host-one' });
  });
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe('anonymous RSVP rules', () => {
  it('allows a valid RSVP index and private edit capability for a published event', async () => {
    const guestDatabase = testEnvironment.unauthenticatedContext().database();
    const ownerDatabase = testEnvironment.authenticatedContext('host-one').database();
    await assertSucceeds(set(ref(guestDatabase, 'privateEvents/published-event/inbox/submission-one'), {
      token: '0123456789012345678901234567890123456789012',
      createdAt: 100,
      decision: 'confirmed',
      companions: [{ name: 'Caio', age: 7 }],
    }));
    await assertSucceeds(set(ref(ownerDatabase, 'publicEditCapabilities/owner-capability'), {
      eventId: 'published-event',
      submissionId: 'owner-submission',
      name: 'Helena',
      decision: 'confirmed',
      message: '',
      createdAt: 100,
      updatedAt: 100,
      status: 'unmatched',
      companions: [{ name: 'Caio', age: 7 }],
    }));
    await assertSucceeds(set(ref(guestDatabase, 'publicEditCapabilities/0123456789012345678901234567890123456789012'), {
      eventId: 'published-event',
      submissionId: 'submission-one',
      name: 'Helena',
      decision: 'confirmed',
      message: 'Até breve!',
      createdAt: 100,
      updatedAt: 100,
      status: 'unmatched',
    }));
    const capabilityPath = 'publicEditCapabilities/0123456789012345678901234567890123456789012';
    await assertSucceeds(get(ref(guestDatabase, capabilityPath)));
    await assertFails(set(ref(guestDatabase, capabilityPath), {
      eventId: 'published-event',
      submissionId: 'submission-one',
      name: 'Helena',
      decision: 'confirmed',
      message: 'Até breve!',
      createdAt: 101,
      updatedAt: 101,
      status: 'unmatched',
    }));
    await assertFails(set(ref(guestDatabase, capabilityPath), {
      eventId: 'published-event',
      submissionId: 'submission-one',
      name: 'Helena',
      decision: 'confirmed',
      message: 'Até breve!',
      createdAt: 100,
      updatedAt: 101,
      status: 'unmatched',
      revokedAt: 101,
    }));
  });

  it('denies anonymous reads of the inbox, roster, and capability collection', async () => {
    const guestDatabase = testEnvironment.unauthenticatedContext().database();
    await assertFails(get(ref(guestDatabase, 'privateEvents/published-event/inbox')));
    await assertFails(get(ref(guestDatabase, 'privateEvents/published-event/guests')));
    await assertFails(get(ref(guestDatabase, 'publicEditCapabilities')));
  });

  it('rejects invalid submissions and submissions for unpublished events', async () => {
    const guestDatabase = testEnvironment.unauthenticatedContext().database();
    await assertFails(set(ref(guestDatabase, 'privateEvents/published-event/inbox/invalid'), {
      token: 'token',
      createdAt: 100,
      privateNote: 'unexpected',
    }));
    await assertFails(set(ref(guestDatabase, 'privateEvents/draft-event/inbox/draft-submission'), {
      token: 'draft-token',
      createdAt: 100,
    }));
    await assertFails(set(ref(guestDatabase, 'publicEditCapabilities/draft-token'), {
      eventId: 'draft-event',
      submissionId: 'draft-submission',
      name: 'Helena',
      decision: 'confirmed',
      message: '',
      createdAt: 100,
      updatedAt: 100,
      status: 'unmatched',
    }));
    const tooLongToken = '1123456789012345678901234567890123456789012';
    await assertFails(set(ref(guestDatabase, `publicEditCapabilities/${tooLongToken}`), {
      eventId: 'published-event',
      submissionId: 'long-message',
      name: 'Helena',
      decision: 'confirmed',
      message: 'x'.repeat(501),
      createdAt: 100,
      updatedAt: 100,
      status: 'unmatched',
    }));
    await assertFails(set(ref(guestDatabase, `publicEditCapabilities/${tooLongToken}`), {
      eventId: 'published-event',
      submissionId: 'invalid-decision',
      name: 'Helena',
      decision: 'maybe',
      message: '',
      createdAt: 100,
      updatedAt: 100,
      status: 'matched',
      guestId: 'forged-guest',
    }));
  });

  it('rejects companions with invalid ages or more than 20 entries', async () => {
    const guestDatabase = testEnvironment.unauthenticatedContext().database();
    const token = '3123456789012345678901234567890123456789012';
    const capability = {
      eventId: 'published-event',
      submissionId: 'submission-with-companions',
      name: 'Helena',
      decision: 'confirmed',
      message: '',
      createdAt: 100,
      updatedAt: 100,
      status: 'unmatched',
    };

    await assertFails(set(ref(guestDatabase, `publicEditCapabilities/${token}`), {
      ...capability,
      companions: [{ name: 'Caio', age: 121 }],
    }));
    await assertFails(set(ref(guestDatabase, `publicEditCapabilities/${token}`), {
      ...capability,
      companions: Array.from({ length: 21 }, (_, index) => ({ name: `Pessoa ${index + 1}`, age: 7 })),
    }));
  });

  it('allows the owner to read RSVP records but denies another host', async () => {
    const ownerDatabase = testEnvironment.authenticatedContext('host-one').database();
    const otherHostDatabase = testEnvironment.authenticatedContext('host-two').database();
    await assertSucceeds(get(ref(ownerDatabase, 'privateEvents/published-event/inbox')));
    await assertFails(get(ref(otherHostDatabase, 'privateEvents/published-event/inbox')));
  });

  it('lets the owner revoke a capability and blocks the old token', async () => {
    const ownerDatabase = testEnvironment.authenticatedContext('host-one').database();
    const guestDatabase = testEnvironment.unauthenticatedContext().database();
    const tokenPath = 'publicEditCapabilities/0123456789012345678901234567890123456789012';
    const capability = {
      eventId: 'published-event',
      submissionId: 'submission-one',
      name: 'Helena',
      decision: 'confirmed',
      message: '',
      createdAt: 100,
      updatedAt: 100,
      status: 'unmatched',
    };
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await set(ref(context.database(), tokenPath), capability);
    });
    await assertSucceeds(get(ref(guestDatabase, tokenPath)));
    await assertSucceeds(set(ref(ownerDatabase, tokenPath), { ...capability, revokedAt: 200 }));
    await assertFails(get(ref(guestDatabase, tokenPath)));
    await assertFails(set(ref(guestDatabase, tokenPath), capability));
  });

  it('does not let a guest cancel review requested by the administrator', async () => {
    const guestDatabase = testEnvironment.unauthenticatedContext().database();
    const tokenPath = 'publicEditCapabilities/4123456789012345678901234567890123456789012';
    const held = {
      eventId: 'published-event', submissionId: 'held-response', name: 'Helena',
      decision: 'confirmed', message: '', createdAt: 100, updatedAt: 100,
      status: 'unmatched', reviewRequired: true,
    };
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await set(ref(context.database(), tokenPath), held);
    });
    await assertSucceeds(set(ref(guestDatabase, tokenPath), { ...held, updatedAt: 101, message: 'Nova mensagem' }));
    const { reviewRequired, ...withoutReview } = held;
    await assertFails(set(ref(guestDatabase, tokenPath), { ...withoutReview, updatedAt: 102 }));
    await assertFails(set(ref(guestDatabase, tokenPath), { ...withoutReview, name: 'Helena Costa', updatedAt: 103 }));
  });

  it('puts a renamed RSVP back into review without changing its former guest', async () => {
    const guestDatabase = testEnvironment.unauthenticatedContext().database();
    const tokenPath = 'publicEditCapabilities/2123456789012345678901234567890123456789012';
    const matchedCapability = {
      eventId: 'published-event',
      submissionId: 'submission-one',
      name: 'Helena',
      decision: 'confirmed',
      message: '',
      createdAt: 100,
      updatedAt: 100,
      status: 'matched',
      guestId: 'guest-one',
    };
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await set(ref(context.database(), tokenPath), matchedCapability);
    });
    await assertSucceeds(set(ref(guestDatabase, tokenPath), {
      eventId: 'published-event',
      submissionId: 'submission-one',
      name: 'Helena Costa',
      decision: 'confirmed',
      message: '',
      createdAt: 100,
      updatedAt: 101,
      status: 'unmatched',
    }));
  });
});