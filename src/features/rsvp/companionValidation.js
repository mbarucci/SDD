export const MAX_COMPANIONS = 20;

export function normalizeCompanions(companions = [], decision = 'confirmed') {
  if (!Array.isArray(companions)) throw new Error('A lista de acompanhantes é inválida.');
  if (companions.length > MAX_COMPANIONS) {
    throw new Error(`Você pode adicionar até ${MAX_COMPANIONS} acompanhantes.`);
  }
  if (decision !== 'confirmed' && companions.length > 0) {
    throw new Error('Acompanhantes só podem ser informados ao confirmar presença.');
  }

  return companions.map((companion) => {
    const name = typeof companion?.name === 'string'
      ? companion.name.trim().replace(/\s+/gu, ' ')
      : '';
    const rawAge = companion?.age;
    const age = Number(rawAge);
    if (!name || name.length > 100) throw new Error('Informe um nome de até 100 caracteres.');
    if (rawAge === null || rawAge === undefined || typeof rawAge === 'string' && !rawAge.trim() || !Number.isInteger(age) || age < 0 || age > 120) {
      throw new Error('Informe uma idade inteira entre 0 e 120.');
    }
    return { name, age };
  });
}