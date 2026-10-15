export function formatSavedResponseDate(value) {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(timestamp);
}

export function formatRsvpDecision(decision) {
  if (decision === 'confirmed') return 'Vou';
  if (decision === 'declined') return 'Não posso';
  return '';
}
