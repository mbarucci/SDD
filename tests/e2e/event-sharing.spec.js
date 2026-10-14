import { expect, test } from '@playwright/test';
import { createDraftEvent, registerHost } from './helpers.js';

test('published event can be shared by public link, QR, WhatsApp, and email', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await registerHost(page);
  await createDraftEvent(page, 'Almoço de domingo');
  await page.getByRole('button', { name: 'Publicar evento' }).click();

  const publicLink = page.getByLabel('Link público do evento');
  await expect(publicLink).toHaveValue(/\/event\//);
  await expect(page.getByRole('img', { name: 'QR Code do evento' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Compartilhar pelo WhatsApp' }))
    .toHaveAttribute('href', /^https:\/\/wa\.me\/\?text=/);
  await expect(page.getByRole('link', { name: 'Compartilhar por e-mail' }))
    .toHaveAttribute('href', /^mailto:.*subject=Almo%C3%A7o%20de%20domingo/);
  await page.getByRole('button', { name: 'Copiar link' }).click();
  await expect(page.getByText('Link copiado')).toBeVisible();
});