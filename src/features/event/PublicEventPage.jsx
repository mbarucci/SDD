import { useEffect, useState } from 'react';
import EventGallery from './EventGallery.jsx';
import LocationSection from './LocationSection.jsx';
import { getPublishedEvent } from './publicEventRepository.js';
import GuestRsvpForm from '../rsvp/GuestRsvpForm.jsx';

export default function PublicEventPage({ eventId }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    getPublishedEvent(eventId).then((value) => {
      if (active) setEvent(value);
    }).catch(() => {
      if (active) setLoadError(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [eventId]);

  if (loading) return <main className="page-loading" role="status">Carregando evento...</main>;
  if (loadError || !event) {
    return <main className="unavailable-page"><h1>Evento indisponível</h1><p>Confira o link ou fale com o anfitrião.</p></main>;
  }

  const photos = Object.values(event.photos ?? {});
  const heroPhoto = event.locationImageUrl?.startsWith('https://')
    ? { url: event.locationImageUrl, altText: event.locationImageAltText }
    : photos[0];

  return (
    <main className="public-event-page">
      <section className="public-event-hero" aria-label="Convite do evento">
        <div className="public-event-intro">
          <header className="public-event-header">
            <p className="eyebrow">CONVITE</p>
            <h1>{event.title}</h1>
          </header>
          <section className="public-event-details" aria-label="Detalhes do evento">
            <p><strong>Data</strong><span>{event.date}</span></p>
            <p><strong>Horário</strong><span>{event.time}</span></p>
          </section>
          <section className="public-event-description" id="about">
            <h2>Sobre a festa</h2>
            {event.description && <p>{event.description}</p>}
          </section>
          {event.supportingText && <p className="public-supporting-text">{event.supportingText}</p>}
          <a className="primary-button public-rsvp-link" href="#rsvp">Responder ao convite</a>
        </div>
        <LocationSection event={event} imageUrl={heroPhoto?.url} imageAltText={heroPhoto?.altText} />
      </section>
      <nav aria-label="Navegação do evento" className="public-event-nav">
        <a href="#about">Sobre a festa</a>
        <a href="#photos">Fotos</a>
        <a href="#rsvp">RSVP</a>
        <a href="#guest-message">Mensagem</a>
      </nav>
      <EventGallery photos={photos} />
      {(event.locationImageUrl || Object.keys(event.photos ?? {}).length > 0) && (
        <p className="image-privacy-notice">Provedores externos de imagem podem receber seu endereço IP e metadados de carregamento ao abrir esta página.</p>
      )}
      <GuestRsvpForm eventId={eventId} />
    </main>
  );
}