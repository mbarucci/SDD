import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import RsvpFields from '../../src/features/rsvp/RsvpFields.jsx';

function FieldsHarness() {
  const [name, setName] = useState('');
  const [decision, setDecision] = useState('');
  const [companions, setCompanions] = useState([]);
  const [message, setMessage] = useState('');

  return (
    <form>
      <RsvpFields
        name={name}
        onNameChange={setName}
        decision={decision}
        onDecisionChange={setDecision}
        companions={companions}
        onCompanionsChange={setCompanions}
        message={message}
        onMessageChange={setMessage}
        idPrefix="guest"
      />
    </form>
  );
}

describe('RsvpFields', () => {
  it('exposes the current RSVP decisions and preserves controlled values', async () => {
    const user = userEvent.setup();
    render(<FieldsHarness />);

    await user.type(screen.getByLabelText('Seu nome'), 'Helena');
    await user.click(screen.getByRole('radio', { name: 'Vou' }));
    await user.type(screen.getByLabelText('Mensagem ao anfitrião'), 'Até lá!');

    expect(screen.getByLabelText('Seu nome')).toHaveValue('Helena');
    expect(screen.getByRole('radio', { name: 'Vou' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Não posso' })).not.toBeChecked();
    expect(screen.getByLabelText('Mensagem ao anfitrião')).toHaveValue('Até lá!');
    expect(screen.getByText('7/500')).toBeVisible();
  });

  it('keeps companion name and integer age fields when the controlled form rerenders', async () => {
    const user = userEvent.setup();
    render(<FieldsHarness />);

    await user.click(screen.getByRole('radio', { name: 'Vou' }));
    await user.click(screen.getByRole('button', { name: 'Adicionar acompanhante' }));
    const age = screen.getByLabelText('Idade do acompanhante 1');
    await user.type(screen.getByLabelText('Nome do acompanhante 1'), 'Caio');
    await user.type(age, '7');

    expect(screen.getByLabelText('Nome do acompanhante 1')).toHaveValue('Caio');
    expect(age).toHaveValue(7);
    expect(age).toHaveAttribute('min', '0');
    expect(age).toHaveAttribute('max', '120');
    expect(age).toHaveAttribute('step', '1');
  });
});
