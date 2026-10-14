import { useState } from 'react';
import CompanionList from './CompanionList.jsx';

function reviewLabel(submission) {
  if (submission.reviewRequired || submission.status === 'duplicate-review') return 'Revisão necessária';
  if (submission.status === 'unmatched') return 'Sem correspondência';
  return 'Associada';
}

export default function InboxReview({ guests, onAssociate, onDelete, submissions }) {
  const [selectedGuests, setSelectedGuests] = useState({});
  const pendingSubmissions = submissions.filter(
    (submission) => submission.status !== 'matched' || submission.reviewRequired,
  );

  return (
    <section className="management-section" aria-labelledby="inbox-title">
      <div className="section-heading">
        <h2 id="inbox-title">Respostas para revisar</h2>
        <span>{pendingSubmissions.length}</span>
      </div>
      {pendingSubmissions.length === 0 ? (
        <p className="management-empty">Nenhuma resposta aguarda revisão.</p>
      ) : (
        <ul className="management-list">
          {pendingSubmissions.map((submission) => (
            <li className="management-row" key={submission.submissionId}>
              <div>
                <strong>{submission.name}</strong>
                <span>{reviewLabel(submission)} · {submission.decision === 'confirmed' ? 'Confirmou presença' : 'Não poderá comparecer'}</span>
                {submission.message && <p>{submission.message}</p>}
                {submission.decision === 'confirmed' && <CompanionList guest={submission} />}
              </div>
              <div className="management-row-actions">
                <label className="visually-hidden" htmlFor={`associate-${submission.submissionId}`}>
                  Associar resposta de {submission.name}
                </label>
                <select
                  id={`associate-${submission.submissionId}`}
                  onChange={(event) => setSelectedGuests((current) => ({
                    ...current,
                    [submission.submissionId]: event.target.value,
                  }))}
                  value={selectedGuests[submission.submissionId] ?? ''}
                >
                  <option value="">Selecionar convidado</option>
                  {guests.map((guest, index) => (
                    <option key={guest.guestId} value={guest.guestId}>
                      {guest.name}{guests.filter((item) => item.normalizedName === guest.normalizedName).length > 1 ? ` · ${index + 1}` : ''}
                    </option>
                  ))}
                </select>
                <button
                  className="secondary-button"
                  disabled={!selectedGuests[submission.submissionId]}
                  onClick={() => onAssociate(submission, selectedGuests[submission.submissionId])}
                  type="button"
                >Associar resposta</button>
                {submission.status === 'unmatched' && !submission.reviewRequired && (
                  <button className="text-button" onClick={() => onDelete(submission)} type="button">Excluir envio</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}