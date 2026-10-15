import { expect, test } from '@playwright/test';
import { createDraftEvent, registerHost } from './helpers.js';

test('host creates, edits, validates, previews, and publishes an event', async ({ page }) => {
  await registerHost(page);
  await page.getByRole('button', { name: 'Criar evento' }).click();
  await page.getByRole('button', { name: 'Salvar rascunho' }).click();
  await expect(page.getByLabel('Título')).toHaveJSProperty('validity.valid', false);

  await page.getByLabel('Título').fill('Jantar de outono');
  await page.getByLabel('Data').fill('2027-05-08');
  await page.getByLabel('Horário').fill('19:30');
  const address = 'Avenida Paulista, 1000, São Paulo';
  await page.getByLabel('Local', { exact: true }).fill(address);
  await page.route('https://images.example.test/**', (route) => route.abort());
  await page.getByLabel('URL da foto do local', { exact: true }).fill('https://images.example.test/local.jpg');
  await page.getByLabel('Texto alternativo da foto do local', { exact: true }).fill('Fachada do espaço');
  await expect(page.locator('.location-editor').getByRole('img', { name: 'Fachada do espaço' })).toBeVisible();
  await expect(page.getByText('Imagem do local indisponível')).toBeVisible();
  await page.getByLabel('Descrição').fill('Uma noite para reunir amigos.');
  await page.getByLabel('URL da foto', { exact: true }).fill('https://images.example.test/festa.jpg');
  await page.getByLabel('Texto alternativo da foto', { exact: true }).fill('Mesa decorada para a festa');
  await page.getByRole('button', { name: 'Adicionar foto' }).click();
  await expect(page.locator('.gallery-editor').getByRole('img', { name: 'Mesa decorada para a festa' })).toBeVisible();
  await expect(page.getByText('Imagem indisponível')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Prévia do convite' }).getByRole('link', { name: 'Abrir no Google Maps' }))
    .toHaveAttribute('href', `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`);

  await page.getByRole('button', { name: 'Salvar rascunho' }).click();
  await expect(page.getByText('Rascunho salvo')).toBeVisible();
  await expect(page.locator('.gallery-editor').getByRole('img', { name: 'Mesa decorada para a festa' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Publicar evento' })).toBeVisible();
  await page.getByLabel('Título').fill('');
  await page.getByRole('button', { name: 'Publicar evento' }).click();
  await expect(page.getByLabel('Título')).toHaveJSProperty('validity.valid', false);
  await expect(page.getByText('Rascunho salvo')).toBeVisible();
  await page.getByLabel('Título').fill('Jantar de outono');
  await page.getByRole('button', { name: 'Publicar evento' }).click();
  await expect(page.getByText('Evento publicado')).toBeVisible();
  await page.getByRole('button', { name: 'Compartilhar', exact: true }).click();
  await expect(page.getByLabel('Link público do evento')).toHaveValue(/\/event\//);
});

test('event preview follows the local draft without saving or publishing it', async ({ page }) => {
  await page.route('**/fonts/**', (route) => route.abort());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  await registerHost(page);
  await page.getByRole('button', { name: 'Criar evento' }).click();
  const preview = page.getByRole('region', { name: 'Prévia do convite' });

  await expect(preview).toBeVisible();
  await page.getByLabel('Título').fill('Almoço no jardim');
  await page.getByLabel('Descrição').fill('Um encontro descontraído para toda a família.');
  await expect(preview.locator('h1')).toHaveText('Almoço no jardim');
  await expect(preview).toContainText('Um encontro descontraído para toda a família.');
  await expect(preview.locator('.event-preview-canvas')).toHaveAttribute('inert', '');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Voltar aos eventos' }).first().click();
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Meus eventos' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Almoço no jardim' })).toHaveCount(0);
  await expect(page.getByText('Seu próximo encontro começa aqui.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Criar primeiro evento' })).toBeVisible();
});

test('event list shows its localized date, publication state, and loaded response summary', async ({ page }) => {
  await registerHost(page);
  await createDraftEvent(page, 'Churrasco da família');
  await page.getByRole('button', { name: 'Voltar aos eventos' }).first().click();

  const eventCard = page.getByRole('button', { name: /Churrasco da família/ });
  await expect(eventCard).toContainText('8 de maio de 2027');
  await expect(eventCard).toContainText('Rascunho');
  await expect(eventCard).toContainText('0 confirmados');
  await expect(eventCard).toContainText('0 sem resposta');
});