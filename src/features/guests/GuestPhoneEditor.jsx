import { useState } from 'react';

export default function GuestPhoneEditor({ guest, onSave }) {
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      if (await onSave(guest, phone)) setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div>
        <p>Telefone: {guest.phone || 'Não informado'}</p>
        <button className="text-button" onClick={() => { setPhone(guest.phone ?? ''); setEditing(true); }} type="button">
          Editar telefone de {guest.name}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor={`phone-${guest.guestId}`}>Telefone de {guest.name}</label>
      <input autoComplete="tel" disabled={saving} id={`phone-${guest.guestId}`} maxLength={40} onChange={(event) => setPhone(event.target.value)} type="tel" value={phone} />
      <button className="secondary-button" disabled={saving} type="submit">Salvar telefone</button>
      <button className="text-button" disabled={saving} onClick={() => setEditing(false)} type="button">Cancelar</button>
    </form>
  );
}
