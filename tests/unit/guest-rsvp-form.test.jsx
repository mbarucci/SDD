import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import GuestRsvpForm from '../../src/features/rsvp/GuestRsvpForm.jsx';
import { submitRsvp } from '../../src/features/rsvp/rsvpSubmissionService.js';

vi.mock('../../src/features/rsvp/rsvpSubmissionService.js', () => ({
  submitRsvp: vi.fn(),
}));

beforeEach(() => {
  submitRsvp.mockReset();
});

test('preserves the RSVP fields after a recoverable submission failure', async () => {
  const user = userEvent.setup();
  submitRsvp.mockRejectedValueOnce(new Error('A resposta não foi salva. Tente novamente.'));

  render(<GuestRsvpForm eventId="event-1" />);
  await user.type(screen.getByLabelText('Seu nome'), 'Helena');
  await user.click(screen.getByLabelText('Vou comparecer'));
  await user.type(screen.getByLabelText('Mensagem ao anfitrião'), 'Vou levar uma sobremesa.');
  await user.click(screen.getByRole('button', { name: 'Enviar resposta' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('A resposta não foi salva. Tente novamente.');
  expect(screen.getByLabelText('Seu nome')).toHaveValue('Helena');
  expect(screen.getByLabelText('Vou comparecer')).toBeChecked();
  expect(screen.getByLabelText('Mensagem ao anfitrião')).toHaveValue('Vou levar uma sobremesa.');
});