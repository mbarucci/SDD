import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CopyLinkControl from '../../src/components/CopyLinkControl.jsx';

let clipboard;

beforeEach(() => {
  clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
});

afterEach(() => {
  if (clipboard) {
    Object.defineProperty(navigator, 'clipboard', clipboard);
  } else {
    delete navigator.clipboard;
  }
});

describe('CopyLinkControl', () => {
  it('announces success only after the absolute URL has been copied', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    render(<CopyLinkControl url="/edit/private-token" label="link de edição" />);

    await user.click(screen.getByRole('button', { name: 'Copiar link de edição' }));

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/edit/private-token`);
    expect(await screen.findByRole('status')).toHaveTextContent('Link copiado');
    expect(screen.queryByLabelText('Link para copiar manualmente')).not.toBeInTheDocument();
  });

  it('offers a selectable manual-copy fallback when the clipboard rejects the request', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('Clipboard blocked')) },
    });
    render(<CopyLinkControl url="/edit/private-token" label="link de edição" />);

    await user.click(screen.getByRole('button', { name: 'Copiar link de edição' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Não foi possível copiar');
    expect(screen.getByLabelText('Link para copiar manualmente')).toHaveValue(
      `${window.location.origin}/edit/private-token`,
    );
  });
});
