import { expect, test } from '@playwright/test';
import { createDraftEvent, registerHost } from './helpers.js';
import { guestWorkbook } from '../fixtures/guestWorkbook.js';

test('host previews CSV, imports phones, skips duplicates and preserves homonyms', async ({ page }) => {
  await registerHost(page);
  await createDraftEvent(page, 'Importação de convidados');
  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  const input = page.getByLabel('Arquivo de convidados');
  const file = {
    name: 'convidados.csv', mimeType: 'text/csv',
    buffer: Buffer.from('\uFEFFNome;Telefone\nAlex Silva;(11) 09999-0000\nAlex Silva;11099990000\nAlex Silva;21999990000\nBeatriz;\n'),
  };
  await input.setInputFiles(file);
  await expect(page.getByRole('region', { name: 'Prévia da importação' })).toContainText('3 novos convidados');
  await expect(page.getByText('0 de 100 convidados')).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar importação' }).click();
  await expect(page.getByRole('status')).toContainText('3 convidados importados');
  await expect(page.getByText('3 de 100 convidados')).toBeVisible();
  await expect(page.getByText('Telefone: (11) 09999-0000', { exact: true })).toBeVisible();
  await input.setInputFiles(file);
  await expect(page.getByRole('region', { name: 'Prévia da importação' })).toContainText('0 novos convidados');
  await expect(page.getByRole('button', { name: 'Confirmar importação' })).toBeDisabled();
  await input.setInputFiles({
    name: 'invalidos.csv', mimeType: 'text/csv', buffer: Buffer.from('Nome;Telefone\nCarla;errado'),
  });
  await expect(page.getByRole('alert')).toContainText('Linha 2');
  await expect(page.getByRole('button', { name: 'Confirmar importação' })).toBeDisabled();
  await page.reload();
  await page.getByRole('button', { name: /^Importação de convidados / }).click();
  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  await expect(page.getByText('3 de 100 convidados')).toBeVisible();
});

test('host imports real Excel with column mapping and can cancel before writing', async ({ page }) => {
  await registerHost(page);
  await createDraftEvent(page, 'Importação Excel');
  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  const file = { name: 'convidados.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: guestWorkbook() };
  await page.getByLabel('Arquivo de convidados').setInputFiles(file);
  await page.getByLabel('Coluna de nome', { exact: true }).selectOption('0');
  await page.getByLabel('Coluna de telefone', { exact: true }).selectOption('1');
  const preview = page.getByRole('region', { name: 'Prévia da importação' });
  await expect(preview).toContainText('2 novos convidados');
  await expect(preview).toContainText('0123456789');
  await page.getByRole('button', { name: 'Cancelar importação' }).click();
  await expect(preview).toHaveCount(0);
  await expect(page.getByText('0 de 100 convidados')).toBeVisible();
  await page.getByLabel('Arquivo de convidados').setInputFiles(file);
  await page.getByLabel('Coluna de nome', { exact: true }).selectOption('0');
  await page.getByLabel('Coluna de telefone', { exact: true }).selectOption('1');
  await page.getByRole('button', { name: 'Confirmar importação' }).click();
  await expect(page.getByRole('status')).toContainText('2 convidados importados');
  await expect(page.getByText('Telefone: 0123456789', { exact: true })).toBeVisible();
});

test('import respects the 100 guest limit and never truncates an oversized batch', async ({ page }) => {
  await registerHost(page);
  await createDraftEvent(page, 'Importação até o limite');
  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  const fileInput = page.getByLabel('Arquivo de convidados');
  await fileInput.setInputFiles({
    name: 'limite.csv', mimeType: 'text/csv',
    buffer: Buffer.from(`Nome;Telefone\n${Array.from({ length: 101 }, (_, i) => `Pessoa ${i};`).join('\n')}`),
  });
  await expect(page.getByRole('alert')).toContainText('100 vaga(s)');
  await expect(page.getByRole('button', { name: 'Confirmar importação' })).toBeDisabled();
  await expect(page.getByText('0 de 100 convidados')).toBeVisible();
  await fileInput.setInputFiles({
    name: 'limite.csv', mimeType: 'text/csv',
    buffer: Buffer.from(`Nome;Telefone\n${Array.from({ length: 100 }, (_, i) => `Pessoa ${i};`).join('\n')}`),
  });
  await page.getByRole('button', { name: 'Confirmar importação' }).click();
  await expect(page.getByRole('status')).toContainText('100 convidados importados');
  await expect(page.getByText('100 de 100 convidados')).toBeVisible();
  await fileInput.setInputFiles({
    name: 'excedente.csv', mimeType: 'text/csv', buffer: Buffer.from('Nome;Telefone\nOutra pessoa;'),
  });
  await expect(page.getByRole('alert')).toContainText('0 vaga(s)');
  await expect(page.getByRole('button', { name: 'Confirmar importação' })).toBeDisabled();
});
