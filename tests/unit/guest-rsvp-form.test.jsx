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
  await user.click(screen.getByLabelText('Vou'));
  await user.type(screen.getByLabelText('Mensagem ao anfitrião'), 'Vou levar uma sobremesa.');
  await user.click(screen.getByRole('button', { name: 'Confirmar presença' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('A resposta não foi salva. Tente novamente.');
  expect(screen.getByLabelText('Seu nome')).toHaveValue('Helena');
  expect(screen.getByLabelText('Vou')).toBeChecked();
  expect(screen.getByLabelText('Mensagem ao anfitrião')).toHaveValue('Vou levar uma sobremesa.');
});

test('submits companion names and ages with a confirmed RSVP', async () => {
  const user = userEvent.setup();
  submitRsvp.mockResolvedValueOnce({ token: 'capability-1' });

  render(<GuestRsvpForm eventId="event-1" />);
  await user.type(screen.getByLabelText('Seu nome'), 'Helena');
  await user.click(screen.getByLabelText('Vou'));
  await user.click(screen.getByRole('button', { name: 'Adicionar acompanhante' }));
  await user.type(screen.getByLabelText('Nome do acompanhante 1'), 'Caio');
  await user.type(screen.getByLabelText('Idade do acompanhante 1'), '7');
  await user.click(screen.getByRole('button', { name: 'Confirmar presença' }));

  expect(submitRsvp).toHaveBeenCalledWith({
    eventId: 'event-1',
    name: 'Helena',
    decision: 'confirmed',
    message: '',
    companions: [{ name: 'Caio', age: '7' }],
  });
});