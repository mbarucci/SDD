import { useEffect, useState } from 'react';
import { getEditCapability, saveEditCapability } from './editCapabilityService.js';
import RsvpFields from './RsvpFields.jsx';
import { formatRsvpDecision, formatSavedResponseDate } from './rsvpPresentation.js';

function companionList(value) {
  return Array.isArray(value) ? value : Object.values(value ?? {});
}

export default function EditRsvpPage({ token }) {
  const [capability, setCapability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [decision, setDecision] = useState('');
  const [message, setMessage] = useState('');
  const [companions, setCompanions] = useState([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedResponse, setSavedResponse] = useState(null);

  useEffect(() => {
    let active = true;
    getEditCapability(token).then((value) => {
      if (!active) return;
      setCapability(value);
      setName(value?.name ?? '');
      setDecision(value?.decision ?? '');
      setMessage(value?.message ?? '');
      setCompanions(companionList(value?.companions));
      setSavedResponse(value ? { decision: value.decision, updatedAt: value.updatedAt ?? value.createdAt } : null);
      setLoading(false);
    }).catch(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setStatus('');
    setBusy(true);
    try {
      const updated = await saveEditCapability(capability, {
        name,
        decision,
        message,
        companions: decision === 'confirmed' ? companions : [],
      });
      setCapability(updated);
      setName(updated.name);
      setDecision(updated.decision);
      setMessage(updated.message);
      setCompanions(companionList(updated.companions));
      setSavedResponse({ decision: updated.decision, updatedAt: updated.updatedAt ?? updated.createdAt });
      setStatus('Resposta atualizada.');
    } catch (saveError) {
      setError(saveError.message || 'Este link não está mais disponível.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="public-experience page-loading" role="status">Carregando resposta...</main>;
  if (!capability) {
    return <main className="public-experience unavailable-page"><h1>Link de edição indisponível</h1><p>Peça um novo link ao anfitrião.</p></main>;
  }

  const savedDate = formatSavedResponseDate(savedResponse?.updatedAt);

  return (
    <main className="public-experience edit-rsvp-page">
      <a className="back-link" href={`/event/${encodeURIComponent(capability.eventId)}`}>Voltar ao evento</a>
      <p className="eyebrow">SUA RESPOSTA</p>
      <h1>Editar resposta</h1>
      {savedResponse && (
        <p className="saved-response-notice">
          Você respondeu: <strong className={`response-decision--${savedResponse.decision}`}>{formatRsvpDecision(savedResponse.decision)}</strong>
          {savedDate && ` (em ${savedDate})`}.
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <RsvpFields
          companions={companions}
          decision={decision}
          disabled={busy}
          idPrefix="edit"
          message={message}
          name={name}
          onCompanionsChange={setCompanions}
          onDecisionChange={setDecision}
          onMessageChange={setMessage}
          onNameChange={setName}
        />
        {error && <p className="form-error" role="alert">{error}</p>}
        {status && <p className="form-status" role="status">{status}</p>}
        <button className="primary-button" disabled={busy || !decision} type="submit">
          {busy ? 'Salvando...' : decision === 'confirmed' ? 'Confirmar presença' : decision === 'declined' ? 'Confirmar resposta' : 'Escolha uma resposta'}
        </button>
      </form>
    </main>
  );
}