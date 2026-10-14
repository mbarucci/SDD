import { useState } from 'react';
import { submitRsvp } from './rsvpSubmissionService.js';

export default function GuestRsvpForm({ eventId }) {
  const [name, setName] = useState('');
  const [decision, setDecision] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editUrl, setEditUrl] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const submission = await submitRsvp({ eventId, name, decision, message });
      setEditUrl(`/edit/${submission.token}`);
    } catch (submitError) {
      setError(submitError.message || 'Não foi possível enviar sua resposta. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  if (editUrl) {
    return (
      <section className="rsvp-confirmation" aria-labelledby="rsvp-confirmation-title">
        <h2 id="rsvp-confirmation-title">Resposta enviada</h2>
        <p>Sua resposta foi registrada. Guarde este link para alterá-la depois.</p>
        <p>Se não localizar seu nome na lista do anfitrião, confira a grafia ou fale com ele.</p>
        <a className="primary-button" href={editUrl}>Editar minha resposta</a>
      </section>
    );
  }

  return (
    <section className="guest-rsvp" aria-labelledby="guest-rsvp-title" id="rsvp">
      <h2 id="guest-rsvp-title">Confirme sua presença</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="guest-name">Seu nome</label>
        <input autoComplete="name" id="guest-name" onChange={(event) => setName(event.target.value)} required value={name} />
        <fieldset>
          <legend>Você poderá comparecer?</legend>
          <label><input checked={decision === 'confirmed'} name="decision" onChange={() => setDecision('confirmed')} required type="radio" value="confirmed" /> Vou comparecer</label>
          <label><input checked={decision === 'declined'} name="decision" onChange={() => setDecision('declined')} type="radio" value="declined" /> Não poderei ir</label>
        </fieldset>
        <label htmlFor="guest-message">Mensagem ao anfitrião</label>
        <textarea id="guest-message" maxLength={500} onChange={(event) => setMessage(event.target.value)} rows="3" value={message} />
        <p className="character-count">{message.length}/500</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" disabled={busy} type="submit">{busy ? 'Enviando...' : 'Enviar resposta'}</button>
      </form>
    </section>
  );
}