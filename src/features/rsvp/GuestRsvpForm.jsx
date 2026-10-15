import { useEffect, useRef, useState } from 'react';
import CopyLinkControl from '../../components/CopyLinkControl.jsx';
import { submitRsvp } from './rsvpSubmissionService.js';
import RsvpFields from './RsvpFields.jsx';
import { formatRsvpDecision } from './rsvpPresentation.js';

export default function GuestRsvpForm({ eventId, event }) {
  const [name, setName] = useState('');
  const [decision, setDecision] = useState('');
  const [message, setMessage] = useState('');
  const [companions, setCompanions] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editUrl, setEditUrl] = useState('');
  const confirmationTitleRef = useRef(null);

  useEffect(() => {
    if (editUrl) confirmationTitleRef.current?.focus();
  }, [editUrl]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const submission = await submitRsvp({
        eventId,
        name,
        decision,
        message,
        companions: decision === 'confirmed' ? companions : [],
      });
      if (!submission?.token) throw new Error('A resposta foi salva, mas não foi possível preparar o link de edição. Fale com o anfitrião.');
      setEditUrl(`/edit/${encodeURIComponent(submission.token)}`);
    } catch (submitError) {
      setError(submitError.message || 'Não foi possível enviar sua resposta. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  if (editUrl) {
    return (
      <section
        aria-labelledby="rsvp-confirmation-title"
        className="rsvp-confirmation"
        role="region"
      >
        <p className="eyebrow">RESPOSTA REGISTRADA</p>
        <h2 id="rsvp-confirmation-title" ref={confirmationTitleRef} tabIndex="-1">Resposta enviada</h2>
        <p>Que bom receber sua resposta, {name.trim()}!</p>
        {event?.title && <p>Sobre {event.title}:</p>}
        <p className="saved-rsvp-summary">
          <strong className={`response-decision--${decision}`}>Sua resposta: {formatRsvpDecision(decision)}.</strong>
          {decision === 'confirmed' && companions.length > 0 && ` ${companions.length} acompanhante${companions.length === 1 ? '' : 's'}.`}
        </p>
        <p>Guarde o link abaixo: ele permite alterar sua resposta depois.</p>
        <a className="primary-button" href={editUrl}>Editar minha resposta</a>
        <CopyLinkControl label="link de edição" url={editUrl} />
        <p>Se não localizar seu nome na lista do anfitrião, confira a grafia ou fale com ele.</p>
      </section>
    );
  }

  return (
    <section className="guest-rsvp" aria-labelledby="guest-rsvp-title" id="rsvp">
      <h2 id="guest-rsvp-title">Confirme sua presença</h2>
      <form onSubmit={handleSubmit}>
        <RsvpFields
          companions={companions}
          decision={decision}
          disabled={busy}
          idPrefix="guest"
          message={message}
          name={name}
          onCompanionsChange={setCompanions}
          onDecisionChange={setDecision}
          onMessageChange={setMessage}
          onNameChange={setName}
        />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" disabled={busy || !decision} type="submit">
          {busy ? 'Salvando...' : decision === 'confirmed' ? 'Confirmar presença' : decision === 'declined' ? 'Confirmar resposta' : 'Escolha uma resposta'}
        </button>
      </form>
    </section>
  );
}