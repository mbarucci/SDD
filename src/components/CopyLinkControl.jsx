import { useState } from 'react';

export default function CopyLinkControl({
  url,
  label = 'link de edição',
  successMessage = 'Link copiado. Guarde-o para editar sua resposta depois.',
  fallbackMessage = 'Não foi possível copiar automaticamente. Selecione e copie o link abaixo.',
}) {
  const [status, setStatus] = useState('');
  const [fallbackUrl, setFallbackUrl] = useState('');

  async function copyUrl() {
    try {
      const absoluteUrl = new URL(url, window.location.origin).href;
      if (typeof navigator.clipboard?.writeText !== 'function') {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText(absoluteUrl);
      setFallbackUrl('');
      setStatus(successMessage);
    } catch {
      try {
        setFallbackUrl(new URL(url, window.location.origin).href);
        setStatus(fallbackMessage);
      } catch {
        setFallbackUrl('');
        setStatus('Não foi possível preparar o link para cópia. Peça um novo link ao anfitrião.');
      }
    }
  }

  return (
    <div className="copy-link-control">
      <button className="secondary-button" onClick={copyUrl} type="button">
        Copiar {label}
      </button>
      {fallbackUrl && (
        <input
          aria-label="Link para copiar manualmente"
          onFocus={(event) => event.target.select()}
          readOnly
          value={fallbackUrl}
        />
      )}
      {status && <p aria-live="polite" role="status">{status}</p>}
    </div>
  );
}
