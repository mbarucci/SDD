import { useEffect, useState } from 'react';
import {
  associateInboxSubmission,
  addExpectedGuest,
  deleteExpectedGuest,
  deleteInactiveGuest,
  deleteInboxSubmission,
  detachInboxSubmission,
  getEventGuestSummary,
  listenToEventGuestSummaries,
  listenToEventManagement,
  mergeExpectedGuests,
  reconcileEventInbox,
  removeGuestCompanion,
  saveGuestPhone,
  updateExpectedGuest,
} from './guestRepository.js';
import GuestPhoneEditor from './GuestPhoneEditor.jsx';
import GuestImport from './GuestImport.jsx';
import EditLinkControls from './EditLinkControls.jsx';
import InboxReview from './InboxReview.jsx';
import CompanionList from './CompanionList.jsx';
import HostMessages from './HostMessages.jsx';
import ConfirmedExport from './ConfirmedExport.jsx';
import { companionsForGuest, confirmedParticipants, filterGuestList, topLevelGuests } from './participantList.js';
import { createEvent, listHostEvents, saveEvent } from '../event/eventRepository.js';
import EventEditor from '../event/EventEditor.jsx';
import SharePanel from '../sharing/SharePanel.jsx';
import EventCover from '../event/EventCover.jsx';
import { formatEventDate, formatEventTime } from '../event/eventPresentation.js';

export default function HostDashboard({ user }) {
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventSummaries, setEventSummaries] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPanel, setSelectedPanel] = useState('event');
  const [creating, setCreating] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [managementError, setManagementError] = useState('');
  const [guestNotice, setGuestNotice] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestSearch, setGuestSearch] = useState('');
  const [guestStatus, setGuestStatus] = useState('all');
  const [savingGuest, setSavingGuest] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState('');
  const [editGuestName, setEditGuestName] = useState('');
  const [editGuestPhone, setEditGuestPhone] = useState('');
  const [mergeSourceId, setMergeSourceId] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [management, setManagement] = useState({
    eventId: null,
    guests: [],
    inactiveGuests: [],
    submissions: [],
    ready: false,
  });
  const primaryGuests = topLevelGuests(management.guests);
  const filteredGuests = filterGuestList(primaryGuests, { query: guestSearch, status: guestStatus });

  async function refreshEventSummary(event) {
    setEventSummaries((current) => ({ ...current, [event.id]: { state: 'loading' } }));
    try {
      const summary = await getEventGuestSummary(event.id);
      setEventSummaries((current) => ({ ...current, [event.id]: { state: 'ready', ...summary } }));
    } catch {
      setEventSummaries((current) => ({ ...current, [event.id]: { state: 'error' } }));
    }
  }

  async function refreshEvents() {
    setEventsLoading(true);
    setLoadError('');
    try {
      const nextEvents = await listHostEvents(user.uid);
      setEvents(nextEvents);
      setEventSummaries(Object.fromEntries(nextEvents.map((event) => [event.id, { state: 'loading' }])));
    } catch {
      setEvents([]);
      setEventSummaries({});
      setLoadError('Não foi possível carregar seus eventos. Tente novamente.');
    } finally {
      setEventsLoading(false);
    }
  }

  useEffect(() => {
    void refreshEvents();
  }, [user.uid]);

  useEffect(() => {
    if (selectedEvent || creating || eventsLoading || events.length === 0) return undefined;
    return listenToEventGuestSummaries(events, (eventId, summary) => {
      setEventSummaries((current) => ({ ...current, [eventId]: summary }));
    });
  }, [creating, events, eventsLoading, selectedEvent?.id]);

  useEffect(() => {
    if (!selectedEvent || !['guests', 'messages', 'export'].includes(selectedPanel)) return undefined;
    setManagement({
      eventId: selectedEvent.id,
      guests: [],
      inactiveGuests: [],
      submissions: [],
      ready: false,
    });
    setManagementError('');
    return listenToEventManagement(selectedEvent.id, (result) => {
      if (result.error) {
        setManagementError('Não foi possível carregar a gestão privada. Tente novamente.');
        setManagement(result);
        return;
      }
      setManagementError('');
      setManagement(result);
    });
  }, [selectedEvent?.id, selectedPanel]);

  useEffect(() => {
    if (
      !selectedEvent
      || !['guests', 'messages'].includes(selectedPanel)
      || management.eventId !== selectedEvent.id
      || !management.ready
    ) return;
    void reconcileEventInbox(selectedEvent.id, management.guests, management.submissions).catch(() => {
      setManagementError('Não foi possível sincronizar as respostas recebidas. Tente novamente.');
    });
  }, [selectedEvent?.id, selectedPanel, management.eventId, management.ready, management.guests, management.submissions]);

  async function saveDraft(fields) {
    if (selectedEvent?.id) {
      const savedEvent = await saveEvent({ ...selectedEvent, ...fields });
      setSelectedEvent(savedEvent);
      await refreshEvents();
      await refreshEventSummary(savedEvent);
      return;
    }

    const savedEvent = await createEvent(user.uid, fields);
    setSelectedEvent(savedEvent);
    setSelectedPanel('event');
    setCreating(false);
    await refreshEvents();
    await refreshEventSummary(savedEvent);
  }

  async function publishEvent(fields) {
    const savedEvent = await saveEvent({ ...selectedEvent, ...fields }, true);
    setSelectedEvent(savedEvent);
    await refreshEvents();
    await refreshEventSummary(savedEvent);
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

  async function saveGuestDetails(event, guest) {
    event.preventDefault();
    setManagementError('');
    try {
      await updateExpectedGuest(selectedEvent.id, guest, editGuestName, editGuestPhone);
      setEditingGuestId('');
      setGuestNotice('Cadastro atualizado.');
    } catch (error) {
      setManagementError(error.message || 'Não foi possível editar o convidado.');
    }
  }

  async function deleteGuest(guest) {
    const linkedCount = management.guests.filter((item) => (
      item.guestRole === 'companion'
      && (item.companionOfGuestId === guest.guestId || item.companionOfSubmissionId === guest.submissionId)
    )).length;
    const message = `Excluir ${guest.name}?${guest.submissionId ? ' O RSVP e o link de edição também serão removidos.' : ''}${linkedCount ? ` ${linkedCount} acompanhante(s) cadastrado(s) será(ão) movido(s) para inativos.` : ''}`;
    if (!window.confirm(message)) return;
    try {
      await deleteExpectedGuest(selectedEvent.id, guest);
      setManagementError('');
      setGuestNotice('Convidado excluído.');
      if (mergeSourceId === guest.guestId) setMergeSourceId('');
      if (mergeTargetId === guest.guestId) setMergeTargetId('');
    } catch (error) {
      setManagementError(error.message || 'Não foi possível excluir o convidado.');
    }
  }

  async function mergeGuests(event) {
    event.preventDefault();
    const source = primaryGuests.find((guest) => guest.guestId === mergeSourceId);
    const target = primaryGuests.find((guest) => guest.guestId === mergeTargetId);
    if (!source || !target || source.guestId === target.guestId) {
      setManagementError('Selecione dois convidados diferentes para mesclar.');
      return;
    }
    if (!window.confirm(`Mesclar ${source.name} em ${target.name}? O cadastro de ${target.name} será mantido.`)) return;
    try {
      await mergeExpectedGuests(selectedEvent.id, source, target);
      setMergeSourceId('');
      setMergeTargetId('');
      setManagementError('');
      setGuestNotice('Convidados mesclados.');
    } catch (error) {
      setManagementError(error.message || 'Não foi possível mesclar os convidados.');
    }
  }

  async function removeCompanion(guest, companion) {
    if (!window.confirm(`Excluir o acompanhante ${companion.name} da resposta de ${guest.name}?`)) return;
    try {
      await removeGuestCompanion(selectedEvent.id, guest, companion);
      setManagementError('');
      setGuestNotice('Acompanhante excluído.');
    } catch (error) {
      setManagementError(error.message || 'Não foi possível excluir o acompanhante.');
    }
  }

  async function removeInactiveGuest(guest) {
    if (!window.confirm(`Excluir definitivamente ${guest.name} da lista de inativos?`)) return;
    try {
      await deleteInactiveGuest(selectedEvent.id, guest);
      setManagementError('');
      setGuestNotice('Acompanhante inativo excluído.');
    } catch (error) {
      setManagementError(error.message || 'Não foi possível excluir o acompanhante inativo.');
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
    setGuestSearch('');
    setGuestStatus('all');
  }

  if (selectedEvent || creating) {
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
                <div className="host-event-identity">
                  <EventCover className="host-event-cover" decorative={false} event={selectedEvent} loading="eager" />
                  <div>
                    <button className="back-link" onClick={returnToEvents} type="button">Voltar aos eventos</button>
                    <p className="eyebrow">GESTÃO DO EVENTO</p>
                    <h1>{selectedEvent.title}</h1>
                    <p className="host-event-date">
                      {formatEventDate(selectedEvent.date)} · {formatEventTime(selectedEvent.time)}
                      <span className={`event-status event-status-${selectedEvent.status}`}>
                        {selectedEvent.status === 'published' ? 'Publicado' : 'Rascunho'}
                      </span>
                    </p>
                  </div>
                </div>
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
              <button aria-current={selectedPanel === 'export' ? 'page' : undefined} onClick={() => setSelectedPanel('export')} type="button">Exportar confirmados</button>
            </nav>
            <section aria-label="Resumo do evento" className="event-response-summary">
              {eventSummaries[selectedEvent.id]?.state === 'ready' ? (
                <>
                  <p><strong>{eventSummaries[selectedEvent.id].confirmed}</strong> pessoas confirmadas, incluindo acompanhantes</p>
                  <p><strong>{eventSummaries[selectedEvent.id].pending}</strong> sem resposta</p>
                  <p><strong>{eventSummaries[selectedEvent.id].declined}</strong> não vão</p>
                </>
              ) : eventSummaries[selectedEvent.id]?.state === 'error' ? (
                <p role="alert">Não foi possível carregar o resumo de respostas.</p>
              ) : (
                <p role="status">Carregando o resumo de respostas...</p>
              )}
            </section>
          </>
        )}

        {(!selectedEvent || selectedPanel === 'event') && (
          <EventEditor
            event={selectedEvent}
            onBack={returnToEvents}
            onPublish={publishEvent}
            onSave={saveDraft}
          />
        )}

        {selectedEvent && selectedPanel === 'share' && (
          selectedEvent.status === 'published'
            ? <SharePanel event={selectedEvent} />
            : <p>Publique o evento para compartilhar o link.</p>
        )}

        {selectedEvent && selectedPanel === 'guests' && !management.ready && (
          managementError
            ? <p className="form-error" role="alert">{managementError}</p>
            : <p className="page-loading" role="status">Carregando convidados e respostas...</p>
        )}

        {selectedEvent && selectedPanel === 'guests' && management.ready && (
          <section className="guest-management" aria-labelledby="guest-management-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">LISTA DE PRESENÇA</p>
                <h2 id="guest-management-title">Convidados</h2>
              </div>
            </div>
            <div aria-label="Totais de respostas" className="guest-counts" role="group">
              <span>Pendentes: {guestCounts.pending}</span>
              <span>Confirmados: {guestCounts.confirmed}</span>
              <span>Recusados: {guestCounts.declined}</span>
            </div>
            <p className="guest-limit">{management.guests.length} de 100 convidados</p>
            {management.guests.length >= 100 && <p>Limite de 100 convidados atingido.</p>}
            <div className="guest-list-filters">
              <div>
                <label htmlFor="guest-search">Buscar convidados</label>
                <input
                  autoComplete="off"
                  id="guest-search"
                  onChange={(event) => setGuestSearch(event.target.value)}
                  placeholder="Digite um nome"
                  type="search"
                  value={guestSearch}
                />
              </div>
              <div>
                <label htmlFor="guest-status-filter">Filtrar por status</label>
                <select id="guest-status-filter" onChange={(event) => setGuestStatus(event.target.value)} value={guestStatus}>
                  <option value="all">Todos os status</option>
                  <option value="pending">Sem resposta</option>
                  <option value="confirmed">Confirmaram</option>
                  <option value="declined">Recusaram</option>
                </select>
              </div>
              {(guestSearch || guestStatus !== 'all') && (
                <button
                  className="text-button"
                  onClick={() => { setGuestSearch(''); setGuestStatus('all'); }}
                  type="button"
                >Limpar filtros</button>
              )}
            </div>
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
            <form aria-label="Mesclar convidados" className="guest-merge-form" onSubmit={mergeGuests}>
              <label htmlFor="merge-source">Convidado a remover</label>
              <select id="merge-source" onChange={(event) => setMergeSourceId(event.target.value)} value={mergeSourceId}>
                <option value="">Selecione um convidado</option>
                {primaryGuests.map((guest) => <option key={guest.guestId} value={guest.guestId}>{guest.name}</option>)}
              </select>
              <label htmlFor="merge-target">Convidado que será mantido</label>
              <select id="merge-target" onChange={(event) => setMergeTargetId(event.target.value)} value={mergeTargetId}>
                <option value="">Selecione um convidado</option>
                {primaryGuests.map((guest) => <option key={guest.guestId} value={guest.guestId}>{guest.name}</option>)}
              </select>
              <p>A resposta e os acompanhantes serão associados ao convidado mantido. Conflitos de RSVP ou telefone precisam ser resolvidos antes.</p>
              <button className="secondary-button" disabled={!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId} type="submit">Mesclar convidados</button>
            </form>
            <GuestImport eventId={selectedEvent.id} guests={management.guests} key={selectedEvent.id} />
            <div className="guest-groups">
              {primaryGuests.length === 0 ? (
                <p className="management-empty">Adicione ou importe convidados para começar sua lista.</p>
              ) : filteredGuests.length === 0 ? (
                <p className="management-empty">Nenhum convidado corresponde aos filtros.</p>
              ) : null}
              {[
                ['pending', 'Pendentes', 'Sem resposta'],
                ['confirmed', 'Confirmaram', 'Confirmada'],
                ['declined', 'Recusaram', 'Não comparecerá'],
              ].map(([status, title, label]) => filteredGuests.length > 0 && (
                <section className="management-section" key={status}>
                  <h3>{title}</h3>
                  {filteredGuests.filter((guest) => guest.status === status).length === 0 ? (
                    <p className="management-empty">Nenhum convidado nesta lista.</p>
                  ) : (
                    <ul className="management-list">
                      {filteredGuests.filter((guest) => guest.status === status).map((guest) => {
                        const submission = management.submissions.find(
                          (item) => item.submissionId === guest.submissionId && item.status === 'matched',
                        );
                        return (
                          <li className="management-row" key={guest.guestId}>
                            <div>
                              <strong>{guest.name}</strong>
                              <span className={`guest-status guest-status-${status}`}>{label}</span>
                              <GuestPhoneEditor guest={guest} onSave={updatePhone} />
                              {submission?.message && <p><strong>Recado:</strong> {submission.message}</p>}
                              {(guest.status === 'confirmed' || guest.status === 'declined') && companionsForGuest(guest, management.guests).length > 0 && (
                                <CompanionList
                                  guest={{ ...guest, companions: companionsForGuest(guest, management.guests) }}
                                  onDelete={submission ? (companion) => removeCompanion(guest, companion) : undefined}
                                />
                              )}
                            </div>
                            <div className="guest-management-actions">
                              {editingGuestId === guest.guestId ? (
                                <form aria-label={`Editar ${guest.name}`} onSubmit={(event) => saveGuestDetails(event, guest)}>
                                  <label htmlFor={`edit-name-${guest.guestId}`}>Nome</label>
                                  <input id={`edit-name-${guest.guestId}`} maxLength={100} onChange={(event) => setEditGuestName(event.target.value)} required value={editGuestName} />
                                  <label htmlFor={`edit-phone-${guest.guestId}`}>Telefone</label>
                                  <input id={`edit-phone-${guest.guestId}`} maxLength={40} onChange={(event) => setEditGuestPhone(event.target.value)} type="tel" value={editGuestPhone} />
                                  <button className="primary-button" type="submit">Salvar edição</button>
                                  <button className="text-button" onClick={() => setEditingGuestId('')} type="button">Cancelar edição</button>
                                </form>
                              ) : (
                                <button
                                  className="text-button"
                                  onClick={() => {
                                    setEditingGuestId(guest.guestId);
                                    setEditGuestName(guest.name);
                                    setEditGuestPhone(guest.phone ?? '');
                                  }}
                                  type="button"
                                >
                                  Editar convidado
                                </button>
                              )}
                              <button className="text-button" onClick={() => deleteGuest(guest)} type="button">Excluir convidado</button>
                              {submission && <EditLinkControls eventId={selectedEvent.id} submission={submission} />}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              ))}
            </div>
            <section aria-labelledby="inactive-guests-title" className="management-section">
              <h3 id="inactive-guests-title">Acompanhantes inativos</h3>
              {management.inactiveGuests.length === 0 ? (
                <p className="management-empty">Nenhum acompanhante inativo.</p>
              ) : (
                <ul className="management-list">
                  {management.inactiveGuests.map((guest) => (
                    <li className="management-row" key={guest.guestId}>
                      <div><strong>{guest.name}</strong><span>Inativo</span></div>
                      <button className="text-button" onClick={() => removeInactiveGuest(guest)} type="button">Excluir acompanhante inativo</button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
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

        {selectedEvent && selectedPanel === 'messages' && !management.ready && (
          managementError
            ? <p className="form-error" role="alert">{managementError}</p>
            : <p className="page-loading" role="status">Carregando mensagens...</p>
        )}

        {selectedEvent && selectedPanel === 'messages' && management.ready && (
          <>
            {managementError && <p className="form-error" role="alert">{managementError}</p>}
            <HostMessages submissions={management.submissions} />
          </>
        )}

        {selectedEvent && selectedPanel === 'export' && (
          <ConfirmedExport
            error={!management.ready ? managementError : ''}
            guests={management.guests}
            key={selectedEvent.id}
            loading={!management.ready && !managementError}
          />
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
      {eventsLoading ? (
        <p className="page-loading" role="status">Carregando seus eventos...</p>
      ) : loadError ? null : events.length === 0 ? (
        <section className="empty-state">
          <span aria-hidden="true" className="empty-mark">✳</span>
          <h2>Seu próximo encontro começa aqui.</h2>
          <p>Crie um evento para compartilhar os detalhes e receber respostas.</p>
          <button className="primary-button" onClick={() => setCreating(true)} type="button">Criar primeiro evento</button>
        </section>
      ) : (
        <ul className="event-list">
          {events.map((event) => (
            <li className="event-card" key={event.id}>
              <button
                className="event-card-select"
                onClick={() => {
                  setSelectedEvent(event);
                  setSelectedPanel('event');
                  void refreshEventSummary(event);
                }}
                type="button"
              >
                <EventCover className="event-card-cover" decorative event={event} />
                <span className="event-card-main">
                  <strong>{event.title}</strong>
                  <span>{formatEventDate(event.date)} · {formatEventTime(event.time)}</span>
                </span>
                <span className={`event-status event-status-${event.status}`}>{event.status === 'published' ? 'Publicado' : 'Rascunho'}</span>
                <span aria-label={`Resumo de respostas de ${event.title}`} className="event-card-summary">
                  {eventSummaries[event.id]?.state === 'ready' ? (
                    <>
                      <span>{eventSummaries[event.id].confirmed} confirmados</span>
                      <span>{eventSummaries[event.id].pending} sem resposta</span>
                      <span>{eventSummaries[event.id].declined} não vão</span>
                    </>
                  ) : eventSummaries[event.id]?.state === 'error' ? (
                    <span>Não foi possível carregar o resumo.</span>
                  ) : (
                    <span role="status">Carregando respostas...</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}