function responseDate(timestamp) {
  if (timestamp == null) return null;
  const date = new Date(Number(timestamp));
  return Number.isFinite(date.getTime()) ? date : null;
}

export default function HostMessages({ submissions }) {
  const messages = submissions
    .filter((submission) => submission.message)
    .sort((left, right) => Number(right.updatedAt ?? 0) - Number(left.updatedAt ?? 0));

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
          {messages.map((message) => {
            const date = responseDate(message.updatedAt);
            return (
              <li className="message-row" key={message.submissionId}>
                <div className="message-meta">
                  <strong>{message.name}</strong>
                  {date ? (
                    <time dateTime={date.toISOString()}>
                      Resposta recebida em {date.toLocaleString('pt-BR')}
                    </time>
                  ) : (
                    <span>Data da resposta indisponível</span>
                  )}
                </div>
                <p><strong>Recado ao anfitrião:</strong> {message.message}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}