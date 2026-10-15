import { useEffect, useState } from 'react';
import { associateInboxSubmission, addExpectedGuest, deleteInboxSubmission, detachInboxSubmission, listenToEventManagement, reconcileEventInbox, saveGuestPhone } from './guestRepository.js';
import GuestPhoneEditor from './GuestPhoneEditor.jsx';
import GuestImport from './GuestImport.jsx';
import EditLinkControls from './EditLinkControls.jsx';
import InboxReview from './InboxReview.jsx';
import CompanionList from './CompanionList.jsx';
import HostMessages from './HostMessages.jsx';
import { downloadConfirmedGuests } from './exportConfirmedGuests.js';
import { companionsForGuest, confirmedParticipants, topLevelGuests } from './participantList.js';
import { createEvent, listHostEvents, saveEvent } from '../event/eventRepository.js';
import EventEditor from '../event/EventEditor.jsx';
import SharePanel from '../sharing/SharePanel.jsx';

export default function HostDashboard({ user }) {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPanel, setSelectedPanel] = useState('event');
  const [creating, setCreating] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [managementError, setManagementError] = useState('');
  const [guestNotice, setGuestNotice] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [savingGuest, setSavingGuest] = useState(false);
  const [management, setManagement] = useState({ guests: [], submissions: [] });

  async function refreshEvents() {
    try {
      setEvents(await listHostEvents(user.uid));
      setLoadError('');
    } catch {
      setLoadError('Não foi possível carregar seus eventos. Tente novamente.');
    }
  }

  useEffect(() => {
    void refreshEvents();
  }, [user.uid]);

  useEffect(() => {
    if (!selectedEvent || !['guests', 'messages'].includes(selectedPanel)) return undefined;
    setManagementError('');
    return listenToEventManagement(selectedEvent.id, (result) => {
      if (result.error) {
        setManagementError('Não foi possível carregar a gestão privada. Tente novamente.');
        return;
      }
      setManagement(result);
    });
  }, [selectedEvent?.id, selectedPanel]);

  useEffect(() => {
    if (!selectedEvent || !['guests', 'messages'].includes(selectedPanel)) return;
    void reconcileEventInbox(selectedEvent.id, management.guests, management.submissions).catch(() => {
      setManagementError('Não foi possível sincronizar as respostas recebidas. Tente novamente.');
    });
  }, [selectedEvent?.id, selectedPanel, management.guests, management.submissions]);

  async function saveDraft(fields) {
    if (selectedEvent?.id) {
      const savedEvent = await saveEvent({ ...selectedEvent, ...fields });
      setSelectedEvent(savedEvent);
      await refreshEvents();
      return;
    }

    const savedEvent = await createEvent(user.uid, fields);
    setSelectedEvent(savedEvent);
    setSelectedPanel('event');
    setCreating(false);
    await refreshEvents();
  }

  async function publishEvent(fields) {
    const savedEvent = await saveEvent({ ...selectedEvent, ...fields }, true);
    setSelectedEvent(savedEvent);
    await refreshEvents();
  }

  async function addGuest(event) {
    event.preventDefault();
    setSavingGuest(true);
    setManagementError('');
    setGuestNotice('');
    try {
      await addExpectedGuest(selectedEvent.id, guestName, guestPhone);
      setGuestName('');
      setGuestPhone('');
      setGuestNotice('Convidado cadastrado.');
    } catch (error) {
      setManagementError(error.message || 'Não foi possível cadastrar o convidado. Tente novamente.');
    } finally {
      setSavingGuest(false);
    }
  }

  async function associateSubmission(submission, guestId) {
    const guest = management.guests.find((item) => item.guestId === guestId);
    if (!guest) {
      setManagementError('Convidado não encontrado. Atualize a lista e tente novamente.');
      return;
    }
    try {
      await associateInboxSubmission(selectedEvent.id, submission, guest);
      setManagementError('');
    } catch (error) {
      setManagementError(error.message || 'Não foi possível associar a resposta. Tente novamente.');
    }
  }

  async function detachSubmission(submission) {
    try {
      await detachInboxSubmission(selectedEvent.id, submission);
      setManagementError('');
    } catch {
      setManagementError('Não foi possível desfazer a associação. Tente novamente.');
    }
  }

  async function updatePhone(guest, phone) {
    try {
      await saveGuestPhone(selectedEvent.id, guest, phone);
      setManagementError('');
      return true;
    } catch (error) {
      setManagementError(error.message || 'Não foi possível salvar o telefone. Tente novamente.');
      return false;
    }
  }

  async function deleteSubmission(submission) {
    try {
      await deleteInboxSubmission(selectedEvent.id, submission);
      setManagementError('');
    } catch {
      setManagementError('Não foi possível excluir o envio. Tente novamente.');
    }
  }

  function returnToEvents() {
    setSelectedEvent(null);
    setSelectedPanel('event');
    setCreating(false);
  }

  if (selectedEvent || creating) {
    const primaryGuests = topLevelGuests(management.guests);
    const guestCounts = {
      pending: primaryGuests.filter((guest) => guest.status === 'pending').length,
      confirmed: confirmedParticipants(management.guests).length,
      declined: management.guests.filter((guest) => guest.status === 'declined').length,
    };

    return (
      <main className="host-shell">
        {selectedEvent && (
          <>
            <header className="host-header">
              <div>
                <button className="back-link" onClick={returnToEvents} type="button">Voltar aos eventos</button>
                <p className="eyebrow">GESTÃO DO EVENTO</p>
                <h1>{selectedEvent.title}</h1>
              </div>
              <div className="host-actions">
                <span className="host-email">{user.email}</span>
                <button className="text-button" onClick={user.signOut} type="button">Sair</button>
              </div>
            </header>
            <nav aria-label="Gestão do evento" className="management-nav">
              <button aria-current={selectedPanel === 'event' ? 'page' : undefined} onClick={() => setSelectedPanel('event')} type="button">Evento</button>
              <button aria-current={selectedPanel === 'guests' ? 'page' : undefined} onClick={() => setSelectedPanel('guests')} type="button">Convidados</button>
              <button aria-current={selectedPanel === 'messages' ? 'page' : undefined} onClick={() => setSelectedPanel('messages')} type="button">Mensagens</button>
              <button aria-current={selectedPanel === 'share' ? 'page' : undefined} onClick={() => setSelectedPanel('share')} type="button">Compartilhar</button>
              <button onClick={() => downloadConfirmedGuests(management.guests, 'convidados-confirmados.csv')} type="button">Exportar confirmados (CSV)</button>
            </nav>
          </>
        )}

        {(!selectedEvent || selectedPanel === 'event') && (
          <>
            <EventEditor
              event={selectedEvent}
              onBack={returnToEvents}
              onPublish={publishEvent}
              onSave={saveDraft}
            />
            {selectedEvent?.status === 'published' && <SharePanel event={selectedEvent} />}
          </>
        )}

        {selectedEvent && selectedPanel === 'share' && (
          selectedEvent.status === 'published'
            ? <SharePanel event={selectedEvent} />
            : <p>Publique o evento para compartilhar o link.</p>
        )}

        {selectedEvent && selectedPanel === 'guests' && (
          <section className="guest-management" aria-labelledby="guest-management-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">LISTA DE PRESENÇA</p>
                <h2 id="guest-management-title">Convidados</h2>
              </div>
              <button className="secondary-button" onClick={() => downloadConfirmedGuests(management.guests, 'convidados-confirmados.csv')} type="button">Exportar confirmados (CSV)</button>
            </div>
            <div aria-label="Totais de respostas" className="guest-counts" role="group">
              <span>Pendentes: {guestCounts.pending}</span>
              <span>Confirmados: {guestCounts.confirmed}</span>
              <span>Recusados: {guestCounts.declined}</span>
            </div>
            <p className="guest-limit">{management.guests.length} de 100 convidados</p>
            {management.guests.length >= 100 && <p>Limite de 100 convidados atingido.</p>}
            <form className="guest-add-form" onSubmit={addGuest}>
              <div className="guest-registration-fields">
                <div>
                  <label htmlFor="expected-guest-name">Nome do convidado</label>
                  <input
                    disabled={savingGuest}
                    id="expected-guest-name"
                    maxLength={100}
                    onChange={(event) => setGuestName(event.target.value)}
                    required
                    value={guestName}
                  />
                </div>
                <div>
                  <label htmlFor="expected-guest-phone">Telefone (opcional)</label>
                  <input
                    autoComplete="tel"
                    disabled={savingGuest}
                    id="expected-guest-phone"
                    maxLength={40}
                    onChange={(event) => setGuestPhone(event.target.value)}
                    type="tel"
                    value={guestPhone}
                  />
                </div>
                <button className="primary-button" disabled={savingGuest || management.guests.length >= 100} type="submit">
                  {savingGuest ? 'Salvando...' : 'Adicionar convidado'}
                </button>
              </div>
            </form>
            {guestNotice && <p className="form-status" role="status">{guestNotice}</p>}
            {managementError && <p className="form-error" role="alert">{managementError}</p>}
            <GuestImport eventId={selectedEvent.id} guests={management.guests} key={selectedEvent.id} />
            <div className="guest-groups">
              {[
                ['pending', 'Pendentes', 'Sem resposta'],
                ['confirmed', 'Confirmaram', 'Confirmada'],
                ['declined', 'Recusaram', 'Não comparecerá'],
              ].map(([status, title, label]) => (
                <section className="management-section" key={status}>
                  <h3>{title}</h3>
                  {primaryGuests.filter((guest) => guest.status === status).length === 0 ? (
                    <p className="management-empty">Nenhum convidado nesta lista.</p>
                  ) : (
                    <ul className="management-list">
                      {primaryGuests.filter((guest) => guest.status === status).map((guest) => {
                        const submission = management.submissions.find(
                          (item) => item.submissionId === guest.submissionId && item.status === 'matched',
                        );
                        return (
                          <li className="management-row" key={guest.guestId}>
                            <div>
                              <strong>{guest.name}</strong>
                              <span>{label}</span>
                              <GuestPhoneEditor guest={guest} onSave={updatePhone} />
                              {(guest.status === 'confirmed' || guest.status === 'declined') && companionsForGuest(guest, management.guests).length > 0 && (
                                <CompanionList guest={{ ...guest, companions: companionsForGuest(guest, management.guests) }} />
                              )}
                            </div>
                            {submission && <EditLinkControls eventId={selectedEvent.id} submission={submission} />}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              ))}
            </div>
            {managementError && <p className="form-error" role="alert">{managementError}</p>}
            <InboxReview
              guests={management.guests}
              onAssociate={associateSubmission}
              onDelete={deleteSubmission}
              onDetach={detachSubmission}
              submissions={management.submissions}
            />
          </section>
        )}

        {selectedEvent && selectedPanel === 'messages' && (
          <>
            {managementError && <p className="form-error" role="alert">{managementError}</p>}
            <HostMessages submissions={management.submissions} />
          </>
        )}
      </main>
    );
  }

  return (
    <main className="host-shell">
      <header className="host-header">
        <div>
          <p className="eyebrow">RSVP DE FESTA</p>
          <h1>Meus eventos</h1>
        </div>
        <div className="host-actions">
          <span className="host-email">{user.email}</span>
          <button className="text-button" onClick={user.signOut} type="button">Sair</button>
        </div>
      </header>
      <div className="section-heading">
        <h2>Eventos</h2>
        <button className="primary-button" onClick={() => setCreating(true)} type="button">Criar evento</button>
      </div>
      {loadError && <p className="form-error" role="alert">{loadError}</p>}
      {events.length === 0 ? (
        <section className="empty-state">
          <span aria-hidden="true" className="empty-mark">✳</span>
          <h2>Seu próximo encontro começa aqui.</h2>
          <p>Crie um evento para compartilhar os detalhes e receber respostas.</p>
        </section>
      ) : (
        <ul className="event-list">
          {events.map((event) => (
            <li key={event.id}>
              <button className="event-list-item" onClick={() => { setSelectedEvent(event); setSelectedPanel('event'); }} type="button">
                <span>
                  <strong>{event.title}</strong>
                  <small>{event.date} · {event.time}</small>
                </span>
                <span className={`event-status event-status-${event.status}`}>{event.status === 'published' ? 'Publicado' : 'Rascunho'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}