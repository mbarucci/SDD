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
  await expect(page.getByRole('img', { name: 'Fachada do espaço' })).toBeVisible();
  await expect(page.getByText('Imagem do local indisponível')).toBeVisible();
  await page.getByLabel('Descrição').fill('Uma noite para reunir amigos.');
  await page.getByLabel('URL da foto', { exact: true }).fill('https://images.example.test/festa.jpg');
  await page.getByLabel('Texto alternativo da foto', { exact: true }).fill('Mesa decorada para a festa');
  await page.getByRole('button', { name: 'Adicionar foto' }).click();
  await expect(page.getByRole('img', { name: 'Mesa decorada para a festa' })).toBeVisible();
  await expect(page.getByText('Imagem indisponível')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Abrir no Google Maps' }))
    .toHaveAttribute('href', `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`);

  await page.getByRole('button', { name: 'Salvar rascunho' }).click();
  await expect(page.getByRole('status')).toContainText('Rascunho salvo');
  await expect(page.getByRole('img', { name: 'Mesa decorada para a festa' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Publicar evento' })).toBeVisible();
  await page.getByLabel('Título').fill('');
  await page.getByRole('button', { name: 'Publicar evento' }).click();
  await expect(page.getByLabel('Título')).toHaveJSProperty('validity.valid', false);
  await expect(page.getByRole('status')).toContainText('Rascunho salvo');
  await page.getByLabel('Título').fill('Jantar de outono');
  await page.getByRole('button', { name: 'Publicar evento' }).click();
  await expect(page.getByRole('status')).toContainText('Evento publicado');
  await expect(page.getByLabel('Link público do evento')).toHaveValue(/\/event\//);
});