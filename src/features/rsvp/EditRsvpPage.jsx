import { useEffect, useState } from 'react';
import { getEditCapability, saveEditCapability } from './editCapabilityService.js';
import CompanionFields from './CompanionFields.jsx';

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

  useEffect(() => {
    let active = true;
    getEditCapability(token).then((value) => {
      if (!active) return;
      setCapability(value);
      setName(value?.name ?? '');
      setDecision(value?.decision ?? '');
      setMessage(value?.message ?? '');
      setCompanions(companionList(value?.companions));
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
      setStatus('Resposta atualizada');
    } catch (saveError) {
      setError(saveError.message || 'Este link não está mais disponível.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="page-loading" role="status">Carregando resposta...</main>;
  if (!capability) {
    return <main className="unavailable-page"><h1>Link de edição indisponível</h1><p>Peça um novo link ao anfitrião.</p></main>;
  }

  return (
    <main className="edit-rsvp-page">
      <a className="back-link" href={`/event/${encodeURIComponent(capability.eventId)}`}>Voltar ao evento</a>
      <p className="eyebrow">SUA RESPOSTA</p>
      <h1>Editar resposta</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="guest-name">Seu nome</label>
        <input autoComplete="name" id="guest-name" onChange={(event) => setName(event.target.value)} required value={name} />
        <fieldset>
          <legend>Você poderá comparecer?</legend>
          <label><input checked={decision === 'confirmed'} name="decision" onChange={() => setDecision('confirmed')} required type="radio" value="confirmed" /> Vou comparecer</label>
          <label><input checked={decision === 'declined'} name="decision" onChange={() => setDecision('declined')} type="radio" value="declined" /> Não poderei ir</label>
        </fieldset>
        {decision === 'confirmed' && (
          <CompanionFields companions={companions} idPrefix="edit" onChange={setCompanions} />
        )}
        <label htmlFor="guest-message">Mensagem ao anfitrião</label>
        <textarea id="guest-message" maxLength={500} onChange={(event) => setMessage(event.target.value)} rows="3" value={message} />
        <p className="character-count">{message.length}/500</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        {status && <p className="form-status" role="status">{status}</p>}
        <button className="primary-button" disabled={busy} type="submit">{busy ? 'Salvando...' : 'Salvar resposta'}</button>
      </form>
      <a className="inline-link" href={`/edit/${encodeURIComponent(token)}`}>Editar minha resposta</a>
    </main>
  );
}