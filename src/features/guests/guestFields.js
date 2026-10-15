export function normalizePhone(value = '') {
  const phone = value.trim();
  if (phone && (phone.length > 40 || !/^[+0-9(). -]+$/.test(phone) || !/[0-9]/.test(phone))) {
    throw new Error('Informe um telefone válido com até 40 caracteres.');
  }
  return phone;
}

export function normalizeGuestFields(name, phone = '') {
  if (typeof name !== 'string') throw new Error('Informe o nome do convidado como texto.');
  const displayName = name.trim().replace(/\s+/gu, ' ');
  if (!displayName) throw new Error('Informe o nome do convidado.');
  if (displayName.length > 100) throw new Error('O nome deve ter até 100 caracteres.');
  return { name: displayName, phone: normalizePhone(phone) };
}
