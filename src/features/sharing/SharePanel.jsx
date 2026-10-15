import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { emailShareUrl, eventPublicUrl, whatsappShareUrl } from './shareService.js';
import CopyLinkControl from '../../components/CopyLinkControl.jsx';

export default function SharePanel({ event }) {
  const [qrCode, setQrCode] = useState('');
  const [qrState, setQrState] = useState('loading');
  const [printError, setPrintError] = useState('');
  const url = eventPublicUrl(event.id);

  useEffect(() => {
    let active = true;
    setQrState('loading');
    setQrCode('');
    QRCode.toDataURL(url, { margin: 1, width: 192 })
      .then((dataUrl) => {
        if (active) {
          setQrCode(dataUrl);
          setQrState('ready');
        }
      })
      .catch(() => {
        if (active) {
          setQrCode('');
          setQrState('error');
        }
      });
    return () => { active = false; };
  }, [url]);

  function printQrCode() {
    try {
      window.print();
      setPrintError('');
    } catch {
      setPrintError('Não foi possível abrir a impressão. Baixe o QR Code para imprimir depois.');
    }
  }

  const qrFilename = (event.title || 'evento')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '') || 'evento';

  return (
    <section className="share-section" aria-labelledby="share-title">
      <h3 id="share-title">Compartilhar</h3>
      <label htmlFor="public-event-link">Link público do evento</label>
      <input id="public-event-link" readOnly value={url} />
      <div className="share-actions">
        <CopyLinkControl
          fallbackMessage="Não foi possível copiar o link automaticamente. Selecione e copie o endereço público abaixo."
          label="link"
          successMessage="Link público do evento copiado."
          url={url}
        />
        <a className="secondary-button" href={whatsappShareUrl(event.title, url)} rel="noreferrer" target="_blank">Compartilhar pelo WhatsApp</a>
        <a className="secondary-button" href={emailShareUrl(event.title, url)}>Compartilhar por e-mail</a>
      </div>
      <div aria-live="polite" className="event-qr-section">
        <h4>QR Code do evento</h4>
        {qrState === 'loading' && <p role="status">Preparando o QR Code...</p>}
        {qrState === 'error' && <p role="alert">Não foi possível gerar o QR Code. Tente novamente mais tarde.</p>}
        {qrState === 'ready' && (
          <>
            <figure className="event-qr-print">
              <img alt="QR Code do evento" className="event-qr" height="192" src={qrCode} width="192" />
              <figcaption>{event.title}</figcaption>
            </figure>
            <div className="share-actions">
              <a className="secondary-button" download={`qr-code-${qrFilename}.png`} href={qrCode}>Baixar QR Code</a>
              <button className="secondary-button" onClick={printQrCode} type="button">Imprimir QR Code</button>
            </div>
          </>
        )}
        {printError && <p role="alert">{printError}</p>}
      </div>
    </section>
  );
}