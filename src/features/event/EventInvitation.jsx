import { useState } from 'react';
import LocationSection from './LocationSection.jsx';
import { formatEventDate, formatEventTime, getEventCover } from './eventPresentation.js';

export default function EventInvitation({ event, idPrefix = '' }) {
  const cover = getEventCover(event);
  const [unavailableCoverUrl, setUnavailableCoverUrl] = useState('');
  const coverUnavailable = cover && unavailableCoverUrl === cover.url;
  const idFor = (suffix) => (idPrefix ? `${idPrefix}-${suffix}` : suffix);

  return (
    <section className="event-invitation" aria-label="Convite do evento">
      <section className="public-event-hero" aria-label="Convite do evento">
        <div className="public-event-intro">
          <header className="public-event-header">
            <p className="eyebrow">CONVITE</p>
            <p className="invitation-greeting">Você está convidado</p>
            <h1>{event.title}</h1>
          </header>
          <section className="public-event-details" aria-label="Detalhes do evento">
            <p>
              <strong>Data</strong>
              <time dateTime={event.date || undefined}>{formatEventDate(event.date)}</time>
            </p>
            <p>
              <strong>Horário</strong>
              <time dateTime={event.time || undefined}>{formatEventTime(event.time)}</time>
            </p>
          </section>
          <section className="public-event-description" id={idFor('about')}>
            <h2>Sobre a festa</h2>
            {event.description && <p>{event.description}</p>}
          </section>
          {event.supportingText && <p className="public-supporting-text">{event.supportingText}</p>}
          <a className="primary-button public-rsvp-inline" href={`#${idFor('rsvp')}`} id={idFor('rsvp-inline')}>Responder ao convite</a>
        </div>
        <figure className="public-event-cover">
          {cover && !coverUnavailable ? (
            <img
              alt={cover.altText}
              onError={() => setUnavailableCoverUrl(cover.url)}
              fetchPriority="high"
              decoding="async"
              referrerPolicy="no-referrer"
              src={cover.url}
            />
          ) : (
            <div
              className="public-cover-fallback"
              role="img"
              aria-label={cover ? (cover.altText || 'Imagem do convite indisponível') : 'Convite sem foto'}
            >
              <span>{cover ? 'Imagem do convite indisponível' : 'Um encontro para celebrar'}</span>
              {!cover && <strong>{event.title}</strong>}
            </div>
          )}
        </figure>
      </section>
      <LocationSection event={event} imageUrl="" />
    </section>
  );
}
