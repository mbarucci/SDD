import { useState } from 'react';
import { mapsDirectionsUrl } from './mapsUrl.js';

export default function LocationSection({ event, imageUrl = event.locationImageUrl, imageAltText = event.locationImageAltText }) {
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const secureImage = imageUrl?.startsWith('https://');

  return (
    <section className="public-location" aria-labelledby="public-location-title">
      {secureImage && (imageUnavailable ? (
        <div className="public-image-fallback" aria-label={imageAltText || 'Foto do local'} role="img">
          Imagem do local indisponível
        </div>
      ) : (
        <img
          alt={imageAltText || ''}
          className="public-location-image"
          loading="lazy"
          onError={() => setImageUnavailable(true)}
          referrerPolicy="no-referrer"
          src={imageUrl}
        />
      ))}
      <h2 id="public-location-title">Localização</h2>
      <p>{event.location || 'Endereço não informado'}</p>
      {event.location?.trim() && (
        <a className="inline-link" href={mapsDirectionsUrl(event.location)} rel="noreferrer" target="_blank">
          Abrir no Google Maps
        </a>
      )}
    </section>
  );
}