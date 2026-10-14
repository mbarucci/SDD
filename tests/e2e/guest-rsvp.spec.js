import { expect, test } from '@playwright/test';
import { createDraftEvent, registerHost } from './helpers.js';

test('anonymous guest views a published event and submits an RSVP without overflow', async ({ page }) => {
  await page.route('https://images.example.test/**', (route) => route.abort());
  await registerHost(page);
  await createDraftEvent(page, 'Festa da Helena');
  await page.getByLabel('Descrição').fill('Uma celebração com amigos.');
  await page.getByLabel('URL da foto', { exact: true }).fill('https://images.example.test/festa.jpg');
  await page.getByLabel('Texto alternativo da foto', { exact: true }).fill('Mesa pronta para a festa');
  await page.getByRole('button', { name: 'Adicionar foto' }).click();
  await page.getByLabel('URL da foto do local', { exact: true }).fill('https://images.example.test/local.jpg');
  await page.getByLabel('Texto alternativo da foto do local', { exact: true }).fill('Jardim do espaço');
  await page.getByRole('button', { name: 'Salvar rascunho' }).click();
  await page.getByRole('button', { name: 'Publicar evento' }).click();

  const eventUrl = await page.getByLabel('Link público do evento').inputValue();
  await page.goto('/host');
  await page.getByRole('button', { name: 'Sair' }).click();
  await page.goto(eventUrl);

  const publicHero = page.locator('.public-event-hero');
  await expect(publicHero.getByRole('img', { name: 'Jardim do espaço' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Festa da Helena' })).toBeVisible();
  await expect(page.getByText('Uma celebração com amigos.')).toBeVisible();
  await expect(page.getByText('Avenida Paulista, 1000, São Paulo')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Abrir no Google Maps' })).toBeVisible();
  await expect(page.getByText(/provedores externos de imagem podem receber seu endereço IP/i)).toBeVisible();
  await expect(page.getByText('Imagem indisponível')).toBeVisible();
  await expect(page.getByText('Imagem do local indisponível')).toBeVisible();

  for (const width of [360, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect.poll(() => publicHero.evaluate((hero) => (
      getComputedStyle(hero).gridTemplateColumns.trim().split(/\s+/).length
    ))).toBe(width < 700 ? 1 : 2);
  }

  await page.getByLabel('Seu nome').fill('Helena');
  await page.getByLabel('Vou comparecer').check();
  await page.getByLabel('Mensagem ao anfitrião').fill('Vou levar uma sobremesa.');
  await page.getByRole('button', { name: 'Enviar resposta' }).click();
  await expect(page.getByRole('heading', { name: 'Resposta enviada' })).toBeVisible();
  await expect(page.getByText('Se não localizar seu nome na lista do anfitrião, confira a grafia ou fale com ele.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Editar minha resposta' })).toHaveAttribute('href', /\/edit\//);
});

test('uses the first gallery photo in the invitation hero when no location photo exists', async ({ page }) => {
  await page.route('https://images.example.test/**', (route) => route.abort());
  await registerHost(page);
  await createDraftEvent(page, 'Tarde no jardim');
  await page.getByLabel('URL da foto', { exact: true }).fill('https://images.example.test/jardim.jpg');
  await page.getByLabel('Texto alternativo da foto', { exact: true }).fill('Jardim da celebração');
  await page.getByRole('button', { name: 'Adicionar foto' }).click();
  await page.getByRole('button', { name: 'Salvar rascunho' }).click();
  await page.getByRole('button', { name: 'Publicar evento' }).click();

  const eventUrl = await page.getByLabel('Link público do evento').inputValue();
  await page.goto('/host');
  await page.getByRole('button', { name: 'Sair' }).click();
  await page.goto(eventUrl);

  await expect(page.locator('.public-event-hero').getByRole('img', { name: 'Jardim da celebração' })).toBeVisible();
});