import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { get, ref, set, update } from 'firebase/database';

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
    await set(ref(database, 'publicEvents/published-event'), {
      status: 'published',
      title: 'Festa publicada',
    });
    await set(ref(database, 'publicEvents/draft-event'), {
      status: 'draft',
      title: 'Rascunho privado',
    });
    await set(ref(database, 'privateEvents/owned-event'), {
      ownerUid: 'host-one',
      guests: { guestOne: { name: 'Convidada' } },
    });
    await set(ref(database, 'privateEvents/draft-event'), {
      ownerUid: 'host-one',
    });
    await set(ref(database, 'hostEventIndex/host-one/owned-event'), {
      eventId: 'owned-event',
      title: 'Festa privada',
    });
    await set(ref(database, 'hostEventIndex/host-two/other-event'), {
      eventId: 'other-event',
      title: 'Outra festa',
    });
  });
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe('database security rules', () => {
  it('allows anonymous reads of published event content', async () => {
    const guestDatabase = testEnvironment.unauthenticatedContext().database();
    await assertSucceeds(get(ref(guestDatabase, 'publicEvents/published-event')));
  });

  it('denies anonymous reads of drafts and private guest lists', async () => {
    const guestDatabase = testEnvironment.unauthenticatedContext().database();
    await assertFails(get(ref(guestDatabase, 'publicEvents/draft-event')));
    await assertFails(get(ref(guestDatabase, 'privateEvents/owned-event/guests')));
  });

  it('allows only the owning host to read private event data', async () => {
    const ownerDatabase = testEnvironment.authenticatedContext('host-one').database();
    const otherHostDatabase = testEnvironment.authenticatedContext('host-two').database();
    await assertSucceeds(get(ref(ownerDatabase, 'privateEvents/owned-event')));
    await assertFails(get(ref(otherHostDatabase, 'privateEvents/owned-event')));
  });

  it('prevents the owner UID from changing after event creation', async () => {
    const ownerDatabase = testEnvironment.authenticatedContext('host-one').database();
    await assertFails(update(ref(ownerDatabase, 'privateEvents/owned-event'), { ownerUid: 'host-two' }));
  });

  it('allows the owner to read drafts but not another host', async () => {
    const ownerDatabase = testEnvironment.authenticatedContext('host-one').database();
    const otherHostDatabase = testEnvironment.authenticatedContext('host-two').database();
    await assertSucceeds(get(ref(ownerDatabase, 'publicEvents/draft-event')));
    await assertFails(get(ref(otherHostDatabase, 'publicEvents/draft-event')));
  });

  it('limits the host event index to its matching UID', async () => {
    const ownerDatabase = testEnvironment.authenticatedContext('host-one').database();
    const otherHostDatabase = testEnvironment.authenticatedContext('host-two').database();
    const guestDatabase = testEnvironment.unauthenticatedContext().database();
    await assertSucceeds(get(ref(ownerDatabase, 'hostEventIndex/host-one')));
    await assertFails(get(ref(ownerDatabase, 'hostEventIndex/host-two')));
    await assertFails(get(ref(guestDatabase, 'hostEventIndex/host-one')));
  });

  it('denies access to paths that are not explicitly authorized', async () => {
    const guestDatabase = testEnvironment.unauthenticatedContext().database();
    await assertFails(get(ref(guestDatabase, 'privateEvents/unknown-event')));
  });
});