import { expect, test } from '@playwright/test';
import { createDraftEvent, registerHost } from './helpers.js';

test('host sees management actions while the public event exposes only guest navigation', async ({ page, browser }) => {
  await registerHost(page);
  await createDraftEvent(page, 'Festa contextual');
  await page.getByRole('button', { name: 'Publicar evento' }).click();
  const eventUrl = await page.getByLabel('Link público do evento').inputValue();

  await expect(page.getByRole('navigation', { name: 'Gestão do evento' })).toBeVisible();
  for (const name of ['Evento', 'Convidados', 'Mensagens', 'Compartilhar', 'Exportar confirmados (CSV)']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  }

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await guestPage.goto(eventUrl);
  const guestNavigation = guestPage.getByRole('navigation', { name: 'Navegação do evento' });
  await expect(guestNavigation).toBeVisible();
  for (const name of ['Sobre a festa', 'Fotos', 'RSVP', 'Mensagem']) {
    await expect(guestNavigation.getByRole('link', { name })).toBeVisible();
  }
  await expect(guestNavigation.getByText('Convidados')).toHaveCount(0);
  await expect(guestNavigation.getByText('Exportar confirmados')).toHaveCount(0);
  await guestContext.close();
});