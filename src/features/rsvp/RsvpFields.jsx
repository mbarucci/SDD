import CompanionFields from './CompanionFields.jsx';

export default function RsvpFields({
  name,
  onNameChange,
  decision,
  onDecisionChange,
  companions,
  onCompanionsChange,
  message,
  onMessageChange,
  idPrefix,
  disabled = false,
}) {
  return (
    <>
      <label htmlFor={`${idPrefix}-name`}>Seu nome</label>
      <input
        autoComplete="name"
        disabled={disabled}
        id={`${idPrefix}-name`}
        maxLength={100}
        onChange={(event) => onNameChange(event.target.value)}
        required
        value={name}
      />
      <fieldset disabled={disabled}>
        <legend>Você poderá comparecer?</legend>
        <label className="decision-option">
          <input
            checked={decision === 'confirmed'}
            name={`${idPrefix}-decision`}
            onChange={() => onDecisionChange('confirmed')}
            required
            type="radio"
            value="confirmed"
          />
          Vou
        </label>
        <label className="decision-option">
          <input
            checked={decision === 'declined'}
            name={`${idPrefix}-decision`}
            onChange={() => onDecisionChange('declined')}
            type="radio"
            value="declined"
          />
          Não posso
        </label>
      </fieldset>
      {decision === 'confirmed' && (
        <CompanionFields
          companions={companions}
          disabled={disabled}
          idPrefix={idPrefix}
          onChange={onCompanionsChange}
        />
      )}
      <label htmlFor={`${idPrefix}-message`}>Mensagem ao anfitrião</label>
      <textarea
        disabled={disabled}
        id={`${idPrefix}-message`}
        maxLength={500}
        onChange={(event) => onMessageChange(event.target.value)}
        rows="3"
        value={message}
      />
      <p className="character-count">{message.length}/500</p>
    </>
  );
}
