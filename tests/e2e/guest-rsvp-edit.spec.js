import { expect, test } from '@playwright/test';
import { createDraftEvent, registerHost } from './helpers.js';

async function openPublishedEventAsGuest(page) {
  await registerHost(page);
  await createDraftEvent(page, 'Encontro de sábado');
  await page.getByRole('button', { name: 'Publicar evento' }).click();
  await page.getByRole('button', { name: 'Compartilhar', exact: true }).click();
  const eventUrl = await page.getByLabel('Link público do evento').inputValue();
  await page.goto('/host');
  await page.getByRole('button', { name: 'Sair' }).click();
  await page.goto(eventUrl);
}

test('guest edits the existing RSVP through its individual link', async ({ page }) => {
  await openPublishedEventAsGuest(page);
  await page.getByLabel('Seu nome').fill('Rafaela');
  await page.getByLabel('Vou').check();
  await page.getByLabel('Mensagem ao anfitrião').fill('Chego às oito.');
  await page.getByRole('button', { name: 'Confirmar presença' }).click();

  const editLink = page.getByRole('link', { name: 'Editar minha resposta' });
  const originalEditUrl = await editLink.getAttribute('href');
  await page.goto(originalEditUrl);
  await expect(page.getByRole('heading', { name: 'Editar resposta' })).toBeVisible();
  await expect(page.getByText(/Você respondeu: Vou \(em \d{2}\/\d{2}\/\d{4}\)/)).toBeVisible();
  await expect(page.getByLabel('Seu nome')).toHaveValue('Rafaela');
  await expect(page.getByLabel('Mensagem ao anfitrião')).toHaveValue('Chego às oito.');
  await page.getByLabel('Seu nome').fill('Rafaela Costa');
  await page.getByLabel('Não posso').check();
  await page.getByLabel('Mensagem ao anfitrião').fill('Meus planos mudaram.');
  await page.getByRole('button', { name: 'Confirmar resposta' }).click();
  await expect(page.getByRole('status')).toContainText('Resposta atualizada');
  await expect(page.getByLabel('Seu nome')).toHaveValue('Rafaela Costa');
  await expect(page).toHaveURL(new URL(originalEditUrl, page.url()).href);
});

test('guest can edit companion names and ages through the individual RSVP link', async ({ page }) => {
  await openPublishedEventAsGuest(page);
  await page.getByLabel('Seu nome').fill('Rafaela');
  await page.getByLabel('Vou').check();
  await page.getByRole('button', { name: 'Adicionar acompanhante' }).click();
  await page.getByLabel('Nome do acompanhante 1').fill('Caio');
  await page.getByLabel('Idade do acompanhante 1').fill('7');
  await page.getByRole('button', { name: 'Confirmar presença' }).click();

  const editLink = page.getByRole('link', { name: 'Editar minha resposta' });
  await page.goto(await editLink.getAttribute('href'));
  await expect(page.getByLabel('Nome do acompanhante 1')).toHaveValue('Caio');
  await expect(page.getByLabel('Idade do acompanhante 1')).toHaveValue('7');
  await page.getByLabel('Nome do acompanhante 1').fill('Caio Silva');
  await page.getByLabel('Idade do acompanhante 1').fill('8');
  await page.getByRole('button', { name: 'Confirmar presença' }).click();

  await expect(page.getByRole('status')).toContainText('Resposta atualizada');
  await expect(page.getByLabel('Nome do acompanhante 1')).toHaveValue('Caio Silva');
  await expect(page.getByLabel('Idade do acompanhante 1')).toHaveValue('8');

  await page.getByLabel('Não posso').check();
  await page.getByRole('button', { name: 'Confirmar resposta' }).click();
  await expect(page.getByRole('status')).toContainText('Resposta atualizada');
  await page.reload();
  await expect(page.getByLabel('Não posso')).toBeChecked();
  await expect(page.getByLabel('Nome do acompanhante 1')).toHaveCount(0);
});

test('an invalid edit token does not reveal an RSVP', async ({ page }) => {
  await page.goto('/edit/not-a-valid-capability');
  await expect(page.getByRole('heading', { name: 'Link de edição indisponível' })).toBeVisible();
  await expect(page.getByLabel('Seu nome')).toHaveCount(0);
});

test('host revokes the old edit link and issues a replacement for the same RSVP', async ({ page, browser }) => {
  await registerHost(page);
  await createDraftEvent(page, 'Festa com novo link');
  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  await page.getByLabel('Nome do convidado').fill('Joana');
  await page.getByRole('button', { name: 'Adicionar convidado' }).click();
  await expect(page.getByText('Convidado cadastrado.')).toBeVisible();
  await page.getByRole('button', { name: 'Evento', exact: true }).click();
  await page.getByRole('button', { name: 'Publicar evento' }).click();
  await page.getByRole('button', { name: 'Compartilhar', exact: true }).click();
  const eventUrl = await page.getByLabel('Link público do evento').inputValue();

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await guestPage.goto(eventUrl);
  await guestPage.getByLabel('Seu nome').fill('Joana');
  await guestPage.getByLabel('Vou').check();
  await guestPage.getByRole('button', { name: 'Confirmar presença' }).click();
  const originalEditUrl = await guestPage.getByRole('link', { name: 'Editar minha resposta' }).getAttribute('href');

  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Totais de respostas' })).toContainText('Confirmados: 1');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Revogar e emitir novo link' }).click();
  const replacementLink = page.getByRole('link', { name: 'Abrir novo link de edição' });
  await expect(replacementLink).toBeVisible();
  const replacementEditUrl = await replacementLink.getAttribute('href');
  expect(replacementEditUrl).not.toBe(originalEditUrl);

  const recheckContext = await browser.newContext();
  const recheckPage = await recheckContext.newPage();
  await recheckPage.goto(originalEditUrl);
  await expect(recheckPage.getByRole('heading', { name: 'Link de edição indisponível' })).toBeVisible();
  await recheckPage.goto(replacementEditUrl);
  await expect(recheckPage.getByRole('heading', { name: 'Editar resposta' })).toBeVisible();

  await recheckContext.close();
  await guestContext.close();
});