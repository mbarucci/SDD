import { useState } from 'react';
import CompanionList from './CompanionList.jsx';

function reviewLabel(submission) {
  if (submission.reviewRequired || submission.status === 'duplicate-review') return 'Revisão necessária';
  if (submission.status === 'unmatched') return 'Sem correspondência';
  return 'Associada';
}

export default function InboxReview({ guests, onAssociate, onDelete, onDetach, submissions }) {
  const [selectedGuests, setSelectedGuests] = useState({});
  const [saving, setSaving] = useState(false);
  async function perform(action) {
    setSaving(true);
    try {
      await action();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="management-section" aria-labelledby="inbox-title">
      <div className="section-heading">
        <h2 id="inbox-title">Respostas recebidas</h2>
        <span>{submissions.length}</span>
      </div>
      {submissions.length === 0 ? (
        <p className="management-empty">Nenhuma resposta recebida.</p>
      ) : (
        <ul className="management-list">
          {submissions.map((submission) => (
            <li className="management-row" key={submission.submissionId}>
              <div>
                <strong>{submission.name}</strong>
                <span>{reviewLabel(submission)} · {submission.decision === 'confirmed' ? 'Confirmou presença' : 'Não poderá comparecer'}</span>
                {submission.status === 'matched' && (
                  <p>Convidado associado: {guests.find((guest) => guest.guestId === submission.guestId)?.name ?? 'Cadastro indisponível'}</p>
                )}
                {submission.message && <p>{submission.message}</p>}
                {submission.decision === 'confirmed' && <CompanionList guest={submission} />}
              </div>
              <div className="management-row-actions">
                <label className="visually-hidden" htmlFor={`associate-${submission.submissionId}`}>
                  Associar resposta de {submission.name}
                </label>
                <select
                  id={`associate-${submission.submissionId}`}
                  disabled={saving}
                  onChange={(event) => setSelectedGuests((current) => ({
                    ...current,
                    [submission.submissionId]: event.target.value,
                  }))}
                  value={selectedGuests[submission.submissionId] ?? submission.guestId ?? ''}
                >
                  <option value="">Selecionar convidado</option>
                  {guests.filter((guest) => guest.guestRole !== 'companion').map((guest, index) => (
                    <option
                      disabled={Boolean(guest.submissionId && guest.submissionId !== submission.submissionId)}
                      key={guest.guestId}
                      value={guest.guestId}
                    >
                      {guest.name}{guests.filter((item) => item.normalizedName === guest.normalizedName).length > 1 ? ` · ${index + 1}` : ''}
                    </option>
                  ))}
                </select>
                <button
                  className="secondary-button"
                  disabled={saving || !selectedGuests[submission.submissionId] || selectedGuests[submission.submissionId] === submission.guestId}
                  onClick={() => perform(() => onAssociate(submission, selectedGuests[submission.submissionId]))}
                  type="button"
                >{submission.status === 'matched' ? 'Trocar associação' : 'Associar resposta'}</button>
                {submission.status === 'matched' && (
                  <button className="text-button" disabled={saving} onClick={() => perform(() => onDetach(submission))} type="button">
                    Desfazer associação
                  </button>
                )}
                {submission.status === 'unmatched' && !submission.reviewRequired && (
                  <button className="text-button" disabled={saving} onClick={() => perform(() => onDelete(submission))} type="button">Excluir envio</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}