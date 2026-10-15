import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { get, ref, remove, set } from 'firebase/database';

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
    await set(ref(database, 'publicEvents/published-event'), { status: 'published' });
    const guests = Object.fromEntries(Array.from({ length: 100 }, (_, index) => {
      const slot = `guest-${String(index + 1).padStart(3, '0')}`;
      return [slot, { guestId: `stable-${index + 1}`, name: `Convidado ${index + 1}`, normalizedName: `convidado ${index + 1}`, status: 'pending' }];
    }));
    await set(ref(database, 'privateEvents/published-event'), { ownerUid: 'host-one', guests });
  });
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe('guest roster limits', () => {
  it('keeps phone private and validates owner edits without requiring it on old records', async () => {
    const path = 'privateEvents/published-event/guests/guest-001/phone';
    const owner = testEnvironment.authenticatedContext('host-one').database();
    await assertSucceeds(set(ref(owner, path), '+55 (11) 09999-0000'));
    expect((await get(ref(owner, path))).val()).toBe('+55 (11) 09999-0000');
    await assertFails(get(ref(testEnvironment.unauthenticatedContext().database(), path)));
    await assertFails(set(ref(testEnvironment.unauthenticatedContext().database(), path), '11999990000'));
    await assertFails(set(ref(testEnvironment.authenticatedContext('other-host').database(), path), '11999990000'));
    await assertFails(set(ref(owner, path), 11999990000));
    await assertFails(set(ref(owner, path), '1'.repeat(41)));
    await assertFails(set(ref(owner, path), 'telefone inválido'));
    await assertFails(set(ref(owner, path), '+()'));
    await assertSucceeds(remove(ref(owner, path)));
  });
  it('rejects the 101st guest without changing the existing 100', async () => {
    const ownerDatabase = testEnvironment.authenticatedContext('host-one').database();
    await assertFails(set(ref(ownerDatabase, 'privateEvents/published-event/guests/guest-101'), {
      guestId: 'stable-101',
      name: 'Convidado 101',
      normalizedName: 'convidado 101',
      status: 'pending',
    }));

    const snapshot = await get(ref(ownerDatabase, 'privateEvents/published-event/guests'));
    const guests = Object.values(snapshot.val());
    expect(guests).toHaveLength(100);
    expect(guests[0]).toMatchObject({ name: 'Convidado 1', status: 'pending' });
  });

  it('allows the owner to create the next available numbered slot', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await remove(ref(context.database(), 'privateEvents/published-event/guests'));
    });
    const ownerDatabase = testEnvironment.authenticatedContext('host-one').database();
    await set(ref(ownerDatabase, 'privateEvents/published-event/guests/guest-002'), {
      guestId: 'stable-2',
      name: 'Convidado 2',
      normalizedName: 'convidado 2',
      status: 'pending',
    });

    const snapshot = await get(ref(ownerDatabase, 'privateEvents/published-event/guests/guest-002'));
    expect(snapshot.val()).toMatchObject({ name: 'Convidado 2', status: 'pending' });
  });
});