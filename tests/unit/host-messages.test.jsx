import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import HostMessages from '../../src/features/guests/HostMessages.jsx';

describe('HostMessages', () => {
  it('shows private message context and handles legacy responses without a timestamp', () => {
    render(
      <HostMessages submissions={[
        { submissionId: 'message-1', name: 'Ana Silva', message: 'Chego às oito.', updatedAt: 1_800_000_000_000 },
        { submissionId: 'message-2', name: 'Bia Silva', message: 'Levo a sobremesa.' },
      ]} />,
    );

    expect(screen.getAllByText('Recado ao anfitrião:')).toHaveLength(2);
    expect(screen.getByText('Chego às oito.')).toBeInTheDocument();
    expect(screen.getByText('Data da resposta indisponível')).toBeInTheDocument();
  });
});
