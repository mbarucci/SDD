import { useEffect, useState } from 'react';
import { getEventCover } from './eventPresentation.js';

export default function EventCover({ event, className, decorative = false, loading = 'lazy' }) {
  const cover = getEventCover(event);
  const [unavailableUrl, setUnavailableUrl] = useState('');
  const isUnavailable = cover && unavailableUrl === cover.url;

  useEffect(() => {
    setUnavailableUrl('');
  }, [cover?.url]);

  if (cover && !isUnavailable) {
    return (
      <img
        alt={decorative ? '' : (cover.altText || `Capa do evento ${event.title}`)}
        className={className}
        decoding="async"
        loading={loading}
        onError={() => setUnavailableUrl(cover.url)}
        referrerPolicy="no-referrer"
        src={cover.url}
      />
    );
  }

  return (
    <span
      aria-hidden={decorative ? 'true' : undefined}
      aria-label={decorative ? undefined : `Capa de ${event.title} indisponível`}
      className={`${className} event-cover-fallback`}
      role={decorative ? undefined : 'img'}
    >✳</span>
  );
}
