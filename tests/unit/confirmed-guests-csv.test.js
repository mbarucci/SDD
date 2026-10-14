import { describe, expect, it } from 'vitest';
import { confirmedGuestsCsv } from '../../src/features/guests/exportConfirmedGuests.js';

describe('confirmedGuestsCsv', () => {
  it('exports only confirmed names and excludes private messages', () => {
    const csv = confirmedGuestsCsv([
      { name: 'José, Jr.', status: 'confirmed', updatedAt: 1710000000000, message: 'informação privada' },
      { name: 'Ana', status: 'declined', updatedAt: 1710000001000, message: 'não exportar' },
      { name: 'Mário', status: 'confirmed', updatedAt: 1710000002000, message: '' },
    ]);

    expect(csv).toBe('\uFEFFNome,Situação,Data da última resposta\r\n"José, Jr.","Confirmado","2024-03-09T16:00:00.000Z"\r\n"Mário","Confirmado","2024-03-09T16:00:02.000Z"');
    expect(csv).not.toContain('privada');
    expect(csv).not.toContain('Ana');
  });

  it('escapes quotes in names and retains accented characters', () => {
    expect(confirmedGuestsCsv([{ name: 'D\'Ávila "Duda"', status: 'confirmed', updatedAt: 1710000000000 }]))
      .toBe('\uFEFFNome,Situação,Data da última resposta\r\n"D\'Ávila ""Duda""","Confirmado","2024-03-09T16:00:00.000Z"');
  });
});