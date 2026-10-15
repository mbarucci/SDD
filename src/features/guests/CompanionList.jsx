import { companionsForGuest } from './participantList.js';

export default function CompanionList({ guest, onDelete }) {
  const companions = companionsForGuest(guest);
  if (companions.length === 0) return null;

  return (
    <ul aria-label={`Acompanhantes de ${guest.name}`} className="guest-companion-list">
      {companions.map((companion, index) => (
        <li className="guest-companion-row" key={`${guest.guestId ?? guest.submissionId}-companion-${index}`}>
          <strong>{companion.name}</strong>
          <span>Acompanhante de {guest.name} · {companion.age} {companion.age === 1 ? 'ano' : 'anos'}</span>
          {onDelete && (
            <button className="text-button" onClick={() => onDelete(companion)} type="button">
              Excluir acompanhante {companion.name}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
