import { useState } from 'react';
import { confirmedParticipants } from './participantList.js';
import { downloadConfirmedGuests } from './exportConfirmedGuests.js';

function participantDate(timestamp) {
  if (timestamp == null || !Number.isFinite(Number(timestamp))) return '';
  return new Intl.DateTimeFormat('pt-BR').format(Number(timestamp));
}

export default function ConfirmedExport({
  guests,
  loading = false,
  error = '',
  onDownload = () => downloadConfirmedGuests(guests, 'convidados-confirmados.csv'),
}) {
  const [downloadError, setDownloadError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const participants = confirmedParticipants(guests);

  async function download() {
    setDownloading(true);
    setDownloadError('');
    try {
      await onDownload();
    } catch {
      setDownloadError('Não foi possível baixar o arquivo. Tente novamente.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section aria-labelledby="confirmed-export-title" className="confirmed-export">
      <div className="section-heading">
        <div>
          <p className="eyebrow">LISTA DE PRESENÇA</p>
          <h2 id="confirmed-export-title">Exportar confirmados</h2>
        </div>
      </div>
      {loading ? (
        <p role="status">Carregando confirmados...</p>
      ) : error ? (
        <p role="alert">Não foi possível carregar os confirmados. Tente novamente.</p>
      ) : participants.length === 0 ? (
        <p className="management-empty">Ainda não há presenças confirmadas para exportar.</p>
      ) : (
        <div className="confirmed-export-preview">
          <p>Prévia da lista de confirmados, incluindo acompanhantes associados.</p>
          <div className="confirmed-export-table-wrap">
            <table aria-label="Prévia de confirmados">
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">Idade</th>
                  <th scope="col">Telefone</th>
                  <th scope="col">Convidado principal</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Data da última resposta</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((participant, index) => (
                  <tr key={`${participant.name}-${index}`}>
                    <td>{participant.name}</td>
                    <td>{participant.age}</td>
                    <td>{participant.phone}</td>
                    <td>{participant.companionOf}</td>
                    <td>Confirmado</td>
                    <td>{participantDate(participant.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {downloadError && <p role="alert">{downloadError}</p>}
      {!loading && !error && (
        <button
          className="primary-button"
          disabled={downloading || participants.length === 0}
          onClick={() => void download()}
          type="button"
        >{downloading ? 'Preparando CSV...' : 'Baixar CSV'}</button>
      )}
    </section>
  );
}
