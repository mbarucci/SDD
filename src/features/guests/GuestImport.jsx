import { useMemo, useRef, useState } from 'react';
import { importExpectedGuests } from './guestRepository.js';
import { prepareGuestImport, readGuestFile } from './guestImport.js';

function detectColumn(headers, pattern) {
  return headers.findIndex((header) => pattern.test(header.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()));
}

export default function GuestImport({ eventId, guests }) {
  const [file, setFile] = useState(null);
  const [nameColumn, setNameColumn] = useState('');
  const [phoneColumn, setPhoneColumn] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const input = useRef(null);
  const rows = useMemo(() => file && nameColumn !== '' ? file.data.map(({ cells, row }) => ({
    row, name: cells[Number(nameColumn)] ?? '', phone: phoneColumn === '' ? '' : cells[Number(phoneColumn)] ?? '',
  })) : [], [file, nameColumn, phoneColumn]);
  const preview = useMemo(() => prepareGuestImport(rows, guests), [rows, guests]);

  async function selectFile(event) {
    const selected = event.target.files?.[0];
    setFile(null);
    setError('');
    setNotice('');
    if (!selected) return;
    setBusy(true);
    try {
      const parsed = await readGuestFile(selected);
      const nameIndex = detectColumn(parsed.headers, /^(nome|nome completo|nome do convidado|convidado|name)$/);
      const phoneIndex = detectColumn(parsed.headers, /^(telefone|celular|whatsapp|fone|phone)$/);
      setNameColumn(nameIndex < 0 ? '' : String(nameIndex));
      setPhoneColumn(phoneIndex < 0 ? '' : String(phoneIndex));
      setFile(parsed);
    } catch (failure) {
      setError(`Não foi possível ler o arquivo. ${failure.message}`);
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    setFile(null);
    setError('');
    if (input.current) input.current.value = '';
  }

  async function confirm() {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const summary = await importExpectedGuests(eventId, rows);
      setNotice(`${summary.imported} convidados importados; ${summary.skipped} duplicatas ignoradas.`);
      cancel();
    } catch (failure) {
      setError(`A importação não foi concluída. ${failure.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="management-section guest-import" aria-labelledby="guest-import-title">
      <h3 id="guest-import-title">Importar convidados</h3>
      <p>Excel (.xlsx, primeira aba) ou CSV UTF-8, até 2 MB e 1.000 linhas. A primeira linha preenchida deve conter os títulos das colunas.</p>
      <p>Nome é obrigatório; telefone é opcional. Formate telefones como texto no Excel para preservar zeros e prefixos. Não há envio do arquivo para um serviço externo.</p>
      <label htmlFor="guest-import-file">Arquivo de convidados</label>
      <input accept=".xlsx,.csv" disabled={busy} id="guest-import-file" onChange={selectFile} ref={input} type="file" />
      {busy && <p role="status">Processando importação...</p>}
      {file && (
        <section aria-labelledby="import-preview-title">
          <h4 id="import-preview-title">Prévia da importação</h4>
          <div className="guest-registration-fields">
            <div>
              <label htmlFor="guest-import-name-column">Coluna de nome</label>
              <select id="guest-import-name-column" disabled={busy} onChange={(event) => setNameColumn(event.target.value)} value={nameColumn}>
                <option value="">Selecionar coluna</option>
                {file.headers.map((header, index) => <option key={index} value={index}>{header}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="guest-import-phone-column">Coluna de telefone</label>
              <select id="guest-import-phone-column" disabled={busy} onChange={(event) => setPhoneColumn(event.target.value)} value={phoneColumn}>
                <option value="">Sem telefone</option>
                {file.headers.map((header, index) => <option key={index} value={index}>{header}</option>)}
              </select>
            </div>
          </div>
          <p>{preview.guests.length} novos convidados; {preview.skipped} duplicatas ignoradas.</p>
          <p>Mesmo nome e telefone (ignorando pontuação do número) são duplicatas. Nomes iguais com telefones diferentes são mantidos. Cadastros e respostas existentes não serão substituídos.</p>
          {nameColumn === '' && <p>Selecione a coluna de nome para continuar.</p>}
          {phoneColumn !== '' && nameColumn === phoneColumn && <p role="alert">Escolha colunas diferentes para nome e telefone.</p>}
          {preview.errors.length > 0 && (
            <div role="alert">
              <p>Corrija o arquivo antes de confirmar; nenhum convidado foi importado.</p>
              <ul>{preview.errors.map((message, index) => <li key={index}>{message}</li>)}</ul>
            </div>
          )}
          <ul className="management-list">
            {preview.guests.map((guest, index) => (
              <li className="management-row" key={index}>
                <strong>{guest.name}</strong><span>{guest.phone || 'Sem telefone'}</span>
              </li>
            ))}
          </ul>
          <div className="management-row-actions">
            <button className="secondary-button" disabled={busy} onClick={cancel} type="button">Cancelar importação</button>
            <button
              className="primary-button"
              disabled={busy || nameColumn === '' || nameColumn === phoneColumn || preview.errors.length > 0 || preview.guests.length === 0}
              onClick={confirm}
              type="button"
            >Confirmar importação</button>
          </div>
        </section>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && <p className="form-status" role="status">{notice}</p>}
    </section>
  );
}
