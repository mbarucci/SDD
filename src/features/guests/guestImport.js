import { normalizeGuestFields } from './guestFields.js';
import { normalizeName } from './normalizeName.js';

export function parseCsv(text) {
  const source = text.replace(/^\uFEFF/, '');
  const counts = { ',': 0, ';': 0, '\t': 0 };
  let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === '"') quoted = !quoted;
    if (!quoted && (char === '\n' || char === '\r')) break;
    if (!quoted && char in counts) counts[char] += 1;
  }
  const delimiter = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let closedQuote = false;
  function finishRow() {
    row.push(field);
    rows.push(row);
    if (rows.length > 1001) throw new Error('O arquivo deve ter no máximo 1.000 linhas de dados.');
    row = [];
    field = '';
    closedQuote = false;
  }
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"' && source[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') { inQuotes = false; closedQuote = true; }
      else field += char;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
      closedQuote = false;
    } else if (char === '\r' || char === '\n') {
      finishRow();
      if (char === '\r' && source[i + 1] === '\n') i += 1;
    } else if (char === '"' && !field && !closedQuote) {
      inQuotes = true;
    } else {
      if (closedQuote || char === '"') throw new Error('CSV inválido: confira as aspas e os separadores.');
      field += char;
    }
  }
  if (inQuotes) throw new Error('CSV inválido: aspas não foram fechadas.');
  if (field || row.length || closedQuote) finishRow();
  return rows;
}

export function guestImportKey(guest) {
  return JSON.stringify([normalizeName(guest.name), (guest.phone ?? '').replace(/\D/g, '')]);
}

export function prepareGuestImport(rows, existingGuests = []) {
  const known = new Set(existingGuests.map(guestImportKey));
  const guests = [];
  const errors = [];
  let skipped = 0;
  for (const row of rows) {
    try {
      const phoneValue = row.phone ?? '';
      if (typeof phoneValue !== 'string'
        && !(typeof phoneValue === 'number' && Number.isSafeInteger(phoneValue) && phoneValue >= 0)) {
        throw new Error('O telefone deve ser texto ou número inteiro válido.');
      }
      const guest = normalizeGuestFields(row.name, String(phoneValue));
      const key = guestImportKey(guest);
      if (known.has(key)) { skipped += 1; continue; }
      known.add(key);
      guests.push(guest);
    } catch (error) {
      errors.push(`Linha ${row.row}: ${error.message}`);
    }
  }
  const available = Math.max(0, 100 - existingGuests.length);
  if (guests.length > available) {
    errors.push(`Há ${available} vaga(s) disponível(is), mas o arquivo contém ${guests.length} novos convidados. Nenhum será importado.`);
  }
  return { guests, skipped, errors };
}

export async function readGuestFile(file) {
  if (file.size > 2 * 1024 * 1024) throw new Error('O arquivo deve ter até 2 MB.');
  const extension = file.name.split('.').pop().toLowerCase();
  let rows;
  if (extension === 'csv') {
    const bytes = await file.arrayBuffer();
    let text;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      throw new Error('Salve o CSV com codificação UTF-8 e tente novamente.');
    }
    rows = parseCsv(text);
  } else if (extension === 'xlsx') {
    const { readSheet } = await import('read-excel-file/browser');
    rows = await readSheet(file);
  } else {
    throw new Error('Selecione um arquivo .xlsx ou .csv. Para arquivos .xls, salve como .xlsx.');
  }
  if (rows.length > 1001) throw new Error('O arquivo deve ter no máximo 1.000 linhas de dados.');
  const headerIndex = rows.findIndex((row) => row.some((cell) => cell !== null && String(cell).trim()));
  if (headerIndex < 0) throw new Error('O arquivo está vazio.');
  const headers = rows[headerIndex].map((cell, index) => String(cell ?? '').trim() || `Coluna ${index + 1}`);
  const data = rows.slice(headerIndex + 1).map((cells, index) => ({ cells, row: headerIndex + index + 2 }))
    .filter(({ cells }) => cells.some((cell) => cell !== null && String(cell).trim()));
  if (!data.length) throw new Error('Inclua um cabeçalho e pelo menos um convidado.');
  return { headers, data };
}
