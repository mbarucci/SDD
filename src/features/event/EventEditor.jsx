import { useEffect, useState } from 'react';
import EventGalleryEditor from './EventGalleryEditor.jsx';
import LocationEditor from './LocationEditor.jsx';

const emptyEvent = {
  title: '',
  date: '',
  time: '',
  location: '',
  description: '',
  supportingText: '',
  photos: [],
};

export default function EventEditor({ event, onBack, onPublish, onSave }) {
  const [draft, setDraft] = useState({ ...emptyEvent, ...event });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDraft({ ...emptyEvent, ...event });
  }, [event?.id, event?.updatedAt, event?.status]);

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function save(publish = false) {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (publish) await onPublish(draft);
      else await onSave(draft);
      setStatus(publish ? 'Evento publicado' : 'Rascunho salvo');
    } catch {
      setError('Não foi possível salvar o evento. Verifique sua conexão e tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="event-editor" aria-labelledby="event-editor-title">
      <button className="back-link" onClick={onBack} type="button">Voltar aos eventos</button>
      <p className="eyebrow">CONFIGURAÇÃO DO EVENTO</p>
      <h2 id="event-editor-title">{event?.id ? 'Editar evento' : 'Novo evento'}</h2>
      <form onSubmit={(submitEvent) => { submitEvent.preventDefault(); void save(); }}>
        <label htmlFor="event-title">Título</label>
        <input id="event-title" onChange={(inputEvent) => update('title', inputEvent.target.value)} required value={draft.title} />

        <div className="field-row">
          <div>
            <label htmlFor="event-date">Data</label>
            <input id="event-date" onChange={(inputEvent) => update('date', inputEvent.target.value)} required type="date" value={draft.date} />
          </div>
          <div>
            <label htmlFor="event-time">Horário</label>
            <input id="event-time" onChange={(inputEvent) => update('time', inputEvent.target.value)} required type="time" value={draft.time} />
          </div>
        </div>

        <LocationEditor
          address={draft.location ?? ''}
          imageAltText={draft.locationImageAltText ?? ''}
          imageUrl={draft.locationImageUrl ?? ''}
          onChange={update}
        />

        <label htmlFor="event-description">Descrição</label>
        <textarea id="event-description" onChange={(inputEvent) => update('description', inputEvent.target.value)} rows="4" value={draft.description} />
        <label htmlFor="event-supporting-text">Informações adicionais</label>
        <textarea id="event-supporting-text" onChange={(inputEvent) => update('supportingText', inputEvent.target.value)} rows="3" value={draft.supportingText} />

        <EventGalleryEditor onChange={(photos) => update('photos', photos)} photos={draft.photos ?? []} />

        {error && <p className="form-error" role="alert">{error}</p>}
        {status && <p className="form-status" role="status">{status}</p>}
        <div className="form-actions">
          <button className="primary-button" disabled={busy} type="submit">Salvar rascunho</button>
          {event?.id && event.status !== 'published' && (
            <button
              className="secondary-button"
              disabled={busy}
              onClick={(clickEvent) => {
                if (clickEvent.currentTarget.form.reportValidity()) void save(true);
              }}
              type="button"
            >Publicar evento</button>
          )}
        </div>
      </form>
      {event?.status === 'published' && <p>O evento está publicado e visível aos convidados.</p>}
    </section>
  );
}