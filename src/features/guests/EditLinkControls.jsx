import { useState } from 'react';
import { reissueEditLink } from './guestRepository.js';

export default function EditLinkControls({ eventId, submission }) {
  const [newLink, setNewLink] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function reissue() {
    if (!window.confirm('O link atual será revogado e deixará de funcionar. Emitir um novo link de edição?')) return;
    setBusy(true);
    setError('');
    try {
      setNewLink(await reissueEditLink(eventId, submission));
    } catch {
      setError('Não foi possível emitir um novo link. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="edit-link-controls">
      <button className="text-button" disabled={busy} onClick={reissue} type="button">
        {busy ? 'Emitindo...' : 'Revogar e emitir novo link'}
      </button>
      {newLink && <a href={newLink}>Abrir novo link de edição</a>}
      {error && <span className="form-error" role="alert">{error}</span>}
    </div>
  );
}