export function normalizeName(name) {
  return name.normalize('NFC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('pt-BR');
}