import { useEffect, useState } from 'react';
import EventGallery from './EventGallery.jsx';
import EventInvitation from './EventInvitation.jsx';
import PublicRsvpCta from './PublicRsvpCta.jsx';
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

  if (loading) return <main className="public-experience page-loading" role="status">Carregando evento...</main>;
  if (loadError || !event) {
    return (
      <main className="public-experience unavailable-page">
        <h1>Evento indisponível</h1>
        <p>Confira o link ou fale com o anfitrião.</p>
      </main>
    );
  }

  const photos = Object.values(event.photos ?? {});

  return (
    <main className="public-experience public-event-page">
      <EventInvitation event={event} />
      <PublicRsvpCta targetId="rsvp" />
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
      <GuestRsvpForm event={event} eventId={eventId} />
    </main>
  );
}