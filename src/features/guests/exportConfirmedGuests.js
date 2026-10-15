import { confirmedParticipants } from './participantList.js';

function csvField(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export function confirmedGuestsCsv(guests) {
  const confirmedRows = confirmedParticipants(guests)
    .map((participant) => [
      csvField(participant.name),
      csvField(participant.age),
      csvField(participant.phone),
      csvField(participant.companionOf),
      csvField('Confirmado'),
      csvField(participant.updatedAt ? new Date(participant.updatedAt).toISOString() : ''),
    ].join(','));
  return [`\uFEFFNome,Idade,Telefone,Convidado principal,Situação,Data da última resposta`, ...confirmedRows].join('\r\n');
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