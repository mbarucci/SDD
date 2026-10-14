function csvField(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export function confirmedGuestsCsv(guests) {
  const confirmedRows = guests
    .filter((guest) => guest.status === 'confirmed')
    .map((guest) => [
      csvField(guest.name),
      csvField('Confirmado'),
      csvField(guest.updatedAt ? new Date(guest.updatedAt).toISOString() : ''),
    ].join(','));
  return [`\uFEFFNome,Situação,Data da última resposta`, ...confirmedRows].join('\r\n');
}

export function downloadConfirmedGuests(guests, filename = 'convidados-confirmados.csv') {
  const file = new Blob([confirmedGuestsCsv(guests)], { type: 'text/csv;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(downloadUrl);
}