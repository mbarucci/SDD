import { expect, test } from '@playwright/test';

test('host can register, sign out, sign in, and request password reset', async ({ page }) => {
  const email = `host-${Date.now()}@example.test`;
  const password = 'correct-horse-battery';

  await page.goto('/host');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Criar minha conta' }).click();
  await expect(page.getByRole('heading', { name: 'Meus eventos' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Criar primeiro evento' })).toBeVisible();

  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();

  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Meus eventos' })).toBeVisible();

  await page.getByRole('button', { name: 'Sair' }).click();
  await page.getByRole('button', { name: 'Esqueci minha senha' }).click();
  await page.getByLabel('E-mail').fill(email);
  await page.getByRole('button', { name: 'Enviar link de redefinição' }).click();
  await expect(page.getByRole('status')).toContainText('Se a conta existir');
});

test('host receives a clear error when sign-in credentials do not match', async ({ page }) => {
  await page.goto('/host');
  await page.getByLabel('E-mail').fill('nao-existe@example.test');
  await page.getByLabel('Senha').fill('invalid-password');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByRole('alert')).toHaveText('E-mail ou senha não conferem.');
});