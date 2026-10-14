import { useState } from 'react';

export default function EventGallery({ photos = [] }) {
  const [unavailable, setUnavailable] = useState(() => new Set());

  return (
    <section className="public-gallery" aria-labelledby="public-gallery-title" id="photos">
      <h2 id="public-gallery-title">Fotos</h2>
      {photos.length === 0 ? <p>Nenhuma foto adicionada.</p> : (
        <ul>
          {photos.map((photo) => (
            <li key={photo.photoId}>
              <figure>
                {unavailable.has(photo.photoId) ? (
                  <div className="public-image-fallback" aria-label={photo.altText} role="img">Imagem indisponível</div>
                ) : (
                  <img
                    alt={photo.altText}
                    loading="lazy"
                    onError={() => setUnavailable((current) => new Set(current).add(photo.photoId))}
                    referrerPolicy="no-referrer"
                    src={photo.url}
                  />
                )}
                {photo.caption && <figcaption>{photo.caption}</figcaption>}
              </figure>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}