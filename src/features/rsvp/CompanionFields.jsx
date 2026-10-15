import { MAX_COMPANIONS } from './companionValidation.js';

export default function CompanionFields({ companions, idPrefix, onChange, disabled = false }) {
  function updateCompanion(index, field, value) {
    onChange(companions.map((companion, currentIndex) => (
      currentIndex === index ? { ...companion, [field]: value } : companion
    )));
  }

  return (
    <fieldset className="companion-fieldset" disabled={disabled}>
      <legend>Acompanhantes</legend>
      <p>Informe o nome e a idade de cada pessoa que irá com você.</p>
      {companions.map((companion, index) => (
        <div className="companion-fields" key={`${idPrefix}-companion-${index}`}>
          <label htmlFor={`${idPrefix}-companion-name-${index}`}>Nome do acompanhante {index + 1}</label>
          <input
            id={`${idPrefix}-companion-name-${index}`}
            maxLength={100}
            onChange={(event) => updateCompanion(index, 'name', event.target.value)}
            required
            value={companion.name}
          />
          <label htmlFor={`${idPrefix}-companion-age-${index}`}>Idade do acompanhante {index + 1}</label>
          <input
            id={`${idPrefix}-companion-age-${index}`}
            max="120"
            min="0"
            onChange={(event) => updateCompanion(index, 'age', event.target.value)}
            required
            step="1"
            type="number"
            value={companion.age}
          />
          <button
            className="text-button"
            onClick={() => onChange(companions.filter((_, currentIndex) => currentIndex !== index))}
            type="button"
          >
            Remover acompanhante
          </button>
        </div>
      ))}
      <button
        className="secondary-button"
        disabled={disabled || companions.length >= MAX_COMPANIONS}
        onClick={() => onChange([...companions, { name: '', age: '' }])}
        type="button"
      >
        Adicionar acompanhante
      </button>
      {companions.length >= MAX_COMPANIONS && <p>Limite de {MAX_COMPANIONS} acompanhantes atingido.</p>}
    </fieldset>
  );
}