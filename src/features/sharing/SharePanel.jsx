import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { emailShareUrl, eventPublicUrl, whatsappShareUrl } from './shareService.js';

export default function SharePanel({ event }) {
  const [qrCode, setQrCode] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const url = eventPublicUrl(event.id);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(url, { margin: 1, width: 192 })
      .then((dataUrl) => { if (active) setQrCode(dataUrl); })
      .catch(() => { if (active) setQrCode(''); });
    return () => { active = false; };
  }, [url]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus('Link copiado');
    } catch {
      setCopyStatus('Não foi possível copiar o link neste navegador.');
    }
  }

  return (
    <section className="share-section" aria-labelledby="share-title">
      <h3 id="share-title">Compartilhar</h3>
      <label htmlFor="public-event-link">Link público do evento</label>
      <input id="public-event-link" readOnly value={url} />
      <div className="share-actions">
        <button className="secondary-button" onClick={copyLink} type="button">Copiar link</button>
        <a className="secondary-button" href={whatsappShareUrl(event.title, url)} rel="noreferrer" target="_blank">Compartilhar pelo WhatsApp</a>
        <a className="secondary-button" href={emailShareUrl(event.title, url)}>Compartilhar por e-mail</a>
      </div>
      {copyStatus && <p role="status">{copyStatus}</p>}
      {qrCode && <img alt="QR Code do evento" className="event-qr" height="192" src={qrCode} width="192" />}
    </section>
  );
}