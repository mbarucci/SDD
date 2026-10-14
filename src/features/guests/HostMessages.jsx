export default function HostMessages({ submissions }) {
  const messages = submissions
    .filter((submission) => submission.message)
    .sort((left, right) => right.updatedAt - left.updatedAt);

  return (
    <section className="management-section" aria-labelledby="messages-title">
      <div className="section-heading">
        <h2 id="messages-title">Mensagens recebidas</h2>
        <span>{messages.length}</span>
      </div>
      {messages.length === 0 ? (
        <p className="management-empty">Nenhuma mensagem recebida.</p>
      ) : (
        <ul className="management-list">
          {messages.map((message) => (
            <li className="message-row" key={message.submissionId}>
              <div className="message-meta">
                <strong>{message.name}</strong>
                <time dateTime={new Date(message.updatedAt).toISOString()}>
                  {new Date(message.updatedAt).toLocaleString('pt-BR')}
                </time>
              </div>
              <p>{message.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}