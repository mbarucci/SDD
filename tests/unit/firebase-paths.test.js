import { describe, expect, it } from 'vitest';
import {
  editCapabilityPath,
  inboxPath,
  privateEventPath,
  publicEventPath,
  rosterPath,
} from '../../src/services/firebase/paths.js';

describe('Firebase paths', () => {
  it('keeps public and private event records in separate roots', () => {
    expect(publicEventPath('event-1')).toBe('publicEvents/event-1');
    expect(privateEventPath('event-1')).toBe('privateEvents/event-1');
  });

  it('builds scoped paths for inbox, roster, and edit capabilities', () => {
    expect(inboxPath('event-1')).toBe('privateEvents/event-1/inbox');
    expect(rosterPath('event-1')).toBe('privateEvents/event-1/guests');
    expect(editCapabilityPath('secret-token')).toBe('publicEditCapabilities/secret-token');
  });
});