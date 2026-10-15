import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { toDataURL } = vi.hoisted(() => ({ toDataURL: vi.fn() }));

vi.mock('qrcode', () => ({ default: { toDataURL } }));
vi.mock('../../src/features/sharing/shareService.js', () => ({
  emailShareUrl: () => 'mailto:?subject=Festa&body=https%3A%2F%2Fexample.test%2Fevent%2Fevent-1',
  eventPublicUrl: () => 'https://example.test/event/event-1',
  whatsappShareUrl: () => 'https://wa.me/?text=Festa',
}));

import SharePanel from '../../src/features/sharing/SharePanel.jsx';

describe('SharePanel', () => {
  beforeEach(() => {
    toDataURL.mockReset();
    toDataURL.mockResolvedValue('data:image/png;base64,qr');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete navigator.clipboard;
  });

  it('shows the QR code and reports copy success only after clipboard resolves', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<SharePanel event={{ id: 'event-1', title: 'Festa' }} />);

    expect(await screen.findByRole('img', { name: 'QR Code do evento' })).toHaveAttribute('src', 'data:image/png;base64,qr');
    await userEvent.click(screen.getByRole('button', { name: 'Copiar link' }));

    expect(writeText).toHaveBeenCalledWith('https://example.test/event/event-1');
    expect(await screen.findByRole('status')).toHaveTextContent('Link público do evento copiado.');
    expect(screen.getByRole('link', { name: 'Baixar QR Code' })).toHaveAttribute('download');
  });

  it('shows an actionable error when the QR code cannot be generated or the link cannot be copied', async () => {
    toDataURL.mockRejectedValue(new Error('QR unavailable'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('Clipboard unavailable')) },
    });
    render(<SharePanel event={{ id: 'event-1', title: 'Festa' }} />);

    expect(await screen.findByText('Não foi possível gerar o QR Code. Tente novamente mais tarde.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Copiar link' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Não foi possível copiar o link automaticamente.');
    expect(screen.getByLabelText('Link para copiar manualmente')).toHaveValue('https://example.test/event/event-1');
  });
});
