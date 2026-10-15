import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { createDraftEvent, registerHost } from './helpers.js';

test('host previews and downloads the current confirmed roster as the existing CSV format', async ({ page, browser }) => {
  await registerHost(page);
  await createDraftEvent(page, 'Almoço em família');
  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  await page.getByLabel('Nome do convidado').fill('Ana Silva');
  await page.getByLabel('Telefone (opcional)').fill('+55 11 99999-0000');
  await page.getByRole('button', { name: 'Adicionar convidado' }).click();
  await page.getByRole('button', { name: 'Evento', exact: true }).click();
  await page.getByRole('button', { name: 'Publicar evento' }).click();
  await page.getByRole('button', { name: 'Compartilhar', exact: true }).click();
  const eventUrl = await page.getByLabel('Link público do evento').inputValue();

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await guestPage.goto(eventUrl);
  await guestPage.getByLabel('Seu nome').fill('Ana Silva');
  await guestPage.getByLabel('Vou').check();
  await guestPage.getByRole('button', { name: 'Adicionar acompanhante' }).click();
  await guestPage.getByLabel('Nome do acompanhante 1').fill('Bia Silva');
  await guestPage.getByLabel('Idade do acompanhante 1').fill('7');
  await guestPage.getByRole('button', { name: 'Confirmar presença' }).click();

  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Totais de respostas' })).toContainText('Confirmados: 2');
  await page.getByRole('button', { name: 'Exportar confirmados', exact: true }).click();

  const preview = page.getByRole('table', { name: 'Prévia de confirmados' });
  await expect(preview).toContainText('Ana Silva');
  await expect(preview).toContainText('Bia Silva');
  await expect(preview).toContainText('+55 11 99999-0000');
  await expect(preview).toContainText('Confirmado');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('convidados-confirmados.csv');
  const csv = await readFile(await download.path(), 'utf8');
  expect(csv).toMatch(/^\uFEFFNome,Idade,Telefone,Convidado principal,Situação,Data da última resposta\r\n/);
  expect(csv).toContain('"Ana Silva","","+55 11 99999-0000","","Confirmado"');
  expect(csv).toContain('"Bia Silva","7","","Ana Silva","Confirmado"');

  await guestContext.close();
});
