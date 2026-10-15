import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmedExport from '../../src/features/guests/ConfirmedExport.jsx';

describe('ConfirmedExport', () => {
  it('distinguishes loading, load error, and empty states without enabling download', () => {
    const onDownload = vi.fn();

    const { rerender } = render(<ConfirmedExport error="" guests={[]} loading onDownload={onDownload} />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando confirmados...');
    expect(screen.queryByRole('button', { name: 'Baixar CSV' })).not.toBeInTheDocument();

    rerender(<ConfirmedExport error="Falha de leitura" guests={[]} loading={false} onDownload={onDownload} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar os confirmados.');

    rerender(<ConfirmedExport error="" guests={[]} loading={false} onDownload={onDownload} />);
    expect(screen.getByText('Ainda não há presenças confirmadas para exportar.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Baixar CSV' })).toBeDisabled();
  });

  it('previews confirmed principals and companions and invokes the supplied CSV action', async () => {
    const onDownload = vi.fn();
    render(
      <ConfirmedExport
        error=""
        guests={[
          {
            guestId: 'principal',
            name: 'Ana Silva',
            phone: '+55 11 99999-0000',
            status: 'confirmed',
            updatedAt: 1_800_000_000_000,
            companions: [{ name: 'Bia Silva', age: 7 }],
          },
          { guestId: 'pending', name: 'Caio', status: 'pending' },
        ]}
        loading={false}
        onDownload={onDownload}
      />,
    );

    expect(screen.getByRole('table', { name: 'Prévia de confirmados' })).toHaveTextContent('Ana Silva');
    expect(screen.getByRole('table', { name: 'Prévia de confirmados' })).toHaveTextContent('Bia Silva');
    expect(screen.getByRole('table', { name: 'Prévia de confirmados' })).toHaveTextContent('+55 11 99999-0000');
    await userEvent.click(screen.getByRole('button', { name: 'Baixar CSV' }));
    expect(onDownload).toHaveBeenCalledOnce();
  });

  it('announces a failed download instead of reporting success', async () => {
    render(
      <ConfirmedExport
        guests={[{ guestId: 'principal', name: 'Ana', status: 'confirmed' }]}
        loading={false}
        onDownload={vi.fn().mockRejectedValue(new Error('download failed'))}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Baixar CSV' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível baixar o arquivo. Tente novamente.');
  });
});
