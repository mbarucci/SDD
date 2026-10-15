import { describe, expect, it } from 'vitest';
import { parseCsv, prepareGuestImport, readGuestFile } from '../../src/features/guests/guestImport.js';

describe('guest import', () => {
  it('reads BOM, semicolons, quoted delimiters, escaped quotes and line breaks', () => {
    expect(parseCsv('\uFEFFNome;Telefone\r\n"José; ""Júnior""";"(11) 09999-0000"\r\n"Ana\nSilva";\r\n'))
      .toEqual([['Nome', 'Telefone'], ['José; "Júnior"', '(11) 09999-0000'], ['Ana\nSilva', '']]);
    expect(parseCsv('Nome,Telefone\nAlex,0123456789')).toEqual([['Nome', 'Telefone'], ['Alex', '0123456789']]);
    expect(() => parseCsv('Nome,Telefone\n"Alex,123')).toThrow('aspas');
    expect(() => parseCsv('Nome,Telefone\n"Alex"x,123')).toThrow('CSV');
  });

  it('skips matching name/phone in file and roster while preserving homonyms', () => {
    const result = prepareGuestImport([
      { row: 2, name: ' Alex  Silva ', phone: '(11) 09999-0000' },
      { row: 3, name: 'ALEX SILVA', phone: '11099990000' },
      { row: 4, name: 'Alex Silva', phone: '21999990000' },
      { row: 5, name: 'Beatriz', phone: '' },
    ], [{ name: 'Alex Silva', phone: '11 09999-0000' }]);
    expect(result.skipped).toBe(2);
    expect(result.guests).toEqual([
      { name: 'Alex Silva', phone: '21999990000' },
      { name: 'Beatriz', phone: '' },
    ]);
    expect(result.errors).toEqual([]);
  });

  it('reports row errors and remaining capacity without silently truncating', () => {
    const result = prepareGuestImport([
      { row: 2, name: '', phone: '123' },
      { row: 3, name: 'Ana', phone: 'inválido' },
      { row: 4, name: 'Bruno', phone: '' },
      { row: 5, name: 'Carla', phone: '' },
    ], Array.from({ length: 99 }, (_, i) => ({ name: `Pessoa ${i}` })));
    expect(result.errors.join(' ')).toContain('Linha 2');
    expect(result.errors.join(' ')).toContain('Linha 3');
    expect(result.errors.join(' ')).toContain('1 vaga');
    expect(result.guests).toHaveLength(2);
  });

  it('rejects invalid or oversized files and empty CSVs with explicit feedback', async () => {
    await expect(readGuestFile({ name: 'lista.xls', size: 1 })).rejects.toThrow('.xlsx');
    await expect(readGuestFile({ name: 'lista.csv', size: 3 * 1024 * 1024 })).rejects.toThrow('2 MB');
    await expect(readGuestFile({ name: 'lista.csv', size: 0, arrayBuffer: async () => new ArrayBuffer(0) })).rejects.toThrow('vazio');
    await expect(readGuestFile({
      name: 'lista.csv', size: 1, arrayBuffer: async () => new Uint8Array([0xff]).buffer,
    })).rejects.toThrow('UTF-8');
    expect(() => parseCsv(`Nome\n${'Pessoa\n'.repeat(1001)}`)).toThrow('1.000');
  });
});
