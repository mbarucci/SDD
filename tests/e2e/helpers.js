import { expect } from '@playwright/test';

export async function registerHost(page) {
  const email = `host-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
  await page.goto('/host');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('correct-horse-battery');
  await page.getByRole('button', { name: 'Criar minha conta' }).click();
  await expect(page.getByRole('heading', { name: 'Meus eventos' })).toBeVisible();
  return email;
}

export async function createDraftEvent(page, title = 'Festa de teste') {
  await page.getByRole('button', { name: 'Criar evento' }).click();
  await expect(page.getByRole('heading', { name: 'Novo evento' })).toBeVisible();
  await page.getByLabel('Título').fill(title);
  await page.getByLabel('Data').fill('2027-05-08');
  await page.getByLabel('Horário').fill('19:30');
  await page.getByLabel('Local', { exact: true }).fill('Avenida Paulista, 1000, São Paulo');
  await page.getByRole('button', { name: 'Salvar rascunho' }).click();
  await expect(page.getByText('Rascunho salvo')).toBeVisible();
}