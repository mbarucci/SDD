import { useState } from 'react';
import { mapsDirectionsUrl } from './mapsUrl.js';

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export default function LocationEditor({ address, imageUrl, imageAltText, onChange }) {
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const secureImageUrl = imageUrl && isHttpsUrl(imageUrl);

  return (
    <section className="location-editor" aria-labelledby="location-editor-title">
      <h3 id="location-editor-title">Localização</h3>
      <label htmlFor="event-location">Local</label>
      <input id="event-location" onChange={(event) => onChange('location', event.target.value)} value={address} />
      {address.trim() && (
        <a className="inline-link" href={mapsDirectionsUrl(address)} rel="noreferrer" target="_blank">
          Abrir no Google Maps
        </a>
      )}
      <label htmlFor="location-image-url">URL da foto do local</label>
      <input
        autoComplete="url"
        id="location-image-url"
        onChange={(event) => {
          setImageUnavailable(false);
          onChange('locationImageUrl', event.target.value);
        }}
        pattern="https://.+"
        type="url"
        value={imageUrl}
      />
      <label htmlFor="location-image-alt">Texto alternativo da foto do local</label>
      <input
        id="location-image-alt"
        onChange={(event) => onChange('locationImageAltText', event.target.value)}
        required={Boolean(imageUrl)}
        value={imageAltText}
      />
      {imageUrl && !secureImageUrl && <p className="form-error" role="alert">A foto do local precisa usar uma URL HTTPS.</p>}
      {secureImageUrl && (imageUnavailable ? (
        <div className="location-image-fallback" aria-label={imageAltText || 'Foto do local'} role="img">
          Imagem do local indisponível
        </div>
      ) : (
        <img
          alt={imageAltText}
          className="location-image-preview"
          loading="lazy"
          onError={() => setImageUnavailable(true)}
          src={imageUrl}
        />
      ))}
    </section>
  );
}