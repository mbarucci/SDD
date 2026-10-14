import { useState } from 'react';

export default function EventGalleryEditor({ photos, onChange }) {
  const [url, setUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [error, setError] = useState('');
  const [failedPhotoIds, setFailedPhotoIds] = useState(() => new Set());

  function addPhoto() {
    setError('');
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      setError('Informe uma URL HTTPS válida.');
      return;
    }
    if (parsedUrl.protocol !== 'https:') {
      setError('As fotos precisam usar uma URL HTTPS pública.');
      return;
    }
    if (!altText.trim()) {
      setError('Informe o texto alternativo da foto.');
      return;
    }

    onChange([...photos, {
      photoId: crypto.randomUUID(),
      url: parsedUrl.href,
      altText: altText.trim(),
    }]);
    setUrl('');
    setAltText('');
  }

  function markUnavailable(photoId) {
    setFailedPhotoIds((current) => new Set(current).add(photoId));
  }

  return (
    <section className="gallery-editor" aria-labelledby="gallery-title">
      <h3 id="gallery-title">Galeria de fotos</h3>
      <div>
        <label htmlFor="photo-url">URL da foto</label>
        <input autoComplete="url" id="photo-url" onChange={(event) => setUrl(event.target.value)} type="url" value={url} />
        <label htmlFor="photo-alt">Texto alternativo da foto</label>
        <input id="photo-alt" onChange={(event) => setAltText(event.target.value)} value={altText} />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="secondary-button" onClick={addPhoto} type="button">Adicionar foto</button>
      </div>
      {photos.length > 0 && (
        <ul className="gallery-preview">
          {photos.map((photo) => (
            <li key={photo.photoId}>
              <figure>
                {failedPhotoIds.has(photo.photoId) ? (
                  <div className="image-fallback" aria-label={photo.altText} role="img">Imagem indisponível</div>
                ) : (
                  <img alt={photo.altText} loading="lazy" onError={() => markUnavailable(photo.photoId)} src={photo.url} />
                )}
                <figcaption>{photo.altText}</figcaption>
              </figure>
              <button
                aria-label={`Remover foto: ${photo.altText}`}
                className="text-button"
                onClick={() => onChange(photos.filter((item) => item.photoId !== photo.photoId))}
                type="button"
              >
                Remover foto
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}