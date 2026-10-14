import { expect, test } from '@playwright/test';
import { createDraftEvent, registerHost } from './helpers.js';

test('host reviews duplicate RSVP, reads its private message, and finds inbox after reopening', async ({ page, browser }) => {
  await registerHost(page);
  await createDraftEvent(page, 'Festa da equipe');
  await page.getByRole('button', { name: 'Convidados' }).click();
  await page.getByLabel('Nome do convidado').fill('Alex Silva');
  await page.getByRole('button', { name: 'Adicionar convidado' }).click();
  await expect(page.getByRole('status')).toHaveText('Convidado cadastrado.');
  await page.getByLabel('Nome do convidado').fill('Alex Silva');
  await page.getByRole('button', { name: 'Adicionar convidado' }).click();
  await expect(page.getByRole('status')).toHaveText('Convidado cadastrado.');
  await expect(page.getByText('2 de 100 convidados')).toBeVisible();

  await page.getByRole('button', { name: 'Evento', exact: true }).click();
  await page.getByRole('button', { name: 'Publicar evento' }).click();
  const eventUrl = await page.getByLabel('Link público do evento').inputValue();

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await guestPage.goto(eventUrl);
  await guestPage.getByLabel('Seu nome').fill('Alex Silva');
  await guestPage.getByLabel('Vou comparecer').check();
  await guestPage.getByRole('button', { name: 'Adicionar acompanhante' }).click();
  await guestPage.getByLabel('Nome do acompanhante 1').fill('Bento Silva');
  await guestPage.getByLabel('Idade do acompanhante 1').fill('7');
  await guestPage.getByRole('button', { name: 'Adicionar acompanhante' }).click();
  await guestPage.getByLabel('Nome do acompanhante 2').fill('Cecília Silva');
  await guestPage.getByLabel('Idade do acompanhante 2').fill('35');
  await guestPage.getByLabel('Mensagem ao anfitrião').fill('Preciso de opção vegetariana.');
  await guestPage.getByRole('button', { name: 'Enviar resposta' }).click();

  await page.getByRole('button', { name: 'Convidados' }).click();
  await expect(page.getByText('Revisão necessária')).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('group', { name: 'Totais de respostas' })).toContainText('Pendentes: 2');
  await page.getByLabel('Associar resposta de Alex Silva').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Associar resposta' }).click();
  await expect(page.getByRole('group', { name: 'Totais de respostas' })).toContainText('Confirmados: 3');
  await expect(page.getByRole('group', { name: 'Totais de respostas' })).toContainText('Pendentes: 1');
  await expect(page.getByText('Bento Silva')).toBeVisible();
  await expect(page.getByText('7 anos')).toBeVisible();
  await expect(page.getByText('Cecília Silva')).toBeVisible();
  await expect(page.getByText('35 anos')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar confirmados (CSV)' }).first().click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('convidados-confirmados.csv');

  await page.getByRole('button', { name: 'Mensagens' }).click();
  await expect(page.getByText('Preciso de opção vegetariana.')).toBeVisible();
  await expect(page.getByText('Alex Silva')).toBeVisible();

  await page.getByRole('button', { name: 'Voltar aos eventos' }).click();
  await guestPage.goto(eventUrl);
  await guestPage.getByLabel('Seu nome').fill('Nome sem cadastro');
  await guestPage.getByLabel('Vou comparecer').check();
  await guestPage.getByLabel('Mensagem ao anfitrião').fill('Resposta recebida fora da gestão.');
  await guestPage.getByRole('button', { name: 'Enviar resposta' }).click();
  await expect(guestPage.getByRole('heading', { name: 'Resposta enviada' })).toBeVisible();
  await page.getByRole('button', { name: 'Festa da equipe' }).click();
  await page.getByRole('button', { name: 'Convidados' }).click();
  await expect(page.getByText('Nome sem cadastro', { exact: true })).toBeVisible();
  await expect(page.getByText('Resposta recebida fora da gestão.')).toBeVisible();
  await page.getByRole('button', { name: 'Excluir envio' }).click();
  await expect(page.getByText('Nome sem cadastro', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Totais de respostas' })).toContainText('Pendentes: 1');

  await guestContext.close();
});

test('host can manually associate a renamed RSVP and release its previous guest', async ({ page, browser }) => {
  await registerHost(page);
  await createDraftEvent(page, 'Festa com nome corrigido');
  await page.getByRole('button', { name: 'Convidados' }).click();
  await page.getByLabel('Nome do convidado').fill('Alex Silva');
  await page.getByRole('button', { name: 'Adicionar convidado' }).click();
  await expect(page.getByRole('status')).toHaveText('Convidado cadastrado.');
  await page.getByLabel('Nome do convidado').fill('Beatriz Lima');
  await page.getByRole('button', { name: 'Adicionar convidado' }).click();
  await expect(page.getByRole('status')).toHaveText('Convidado cadastrado.');
  await page.getByRole('button', { name: 'Evento', exact: true }).click();
  await page.getByRole('button', { name: 'Publicar evento' }).click();
  const eventUrl = await page.getByLabel('Link público do evento').inputValue();

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await guestPage.goto(eventUrl);
  await guestPage.getByLabel('Seu nome').fill('Alex Silva');
  await guestPage.getByLabel('Vou comparecer').check();
  await guestPage.getByRole('button', { name: 'Enviar resposta' }).click();
  const editUrl = await guestPage.getByRole('link', { name: 'Editar minha resposta' }).getAttribute('href');
  await page.getByRole('button', { name: 'Convidados' }).click();
  await expect(page.getByRole('group', { name: 'Totais de respostas' })).toContainText('Confirmados: 1');
  await guestPage.goto(editUrl);
  await guestPage.getByLabel('Seu nome').fill('Alex Souza');
  await guestPage.getByRole('button', { name: 'Salvar resposta' }).click();
  await expect(guestPage.getByRole('status')).toContainText('Resposta atualizada');

  await page.getByRole('button', { name: 'Convidados' }).click();
  await expect(page.getByText('Revisão necessária')).toBeVisible();
  await page.getByLabel('Associar resposta de Alex Souza').selectOption({ label: 'Beatriz Lima' });
  await page.getByRole('button', { name: 'Associar resposta' }).click();
  await expect(page.getByRole('group', { name: 'Totais de respostas' })).toContainText('Confirmados: 1');
  await expect(page.getByRole('group', { name: 'Totais de respostas' })).toContainText('Pendentes: 1');
  await expect(page.getByRole('listitem').filter({ hasText: 'Beatriz Lima' })).toContainText('Confirmada');
  await expect(page.getByRole('listitem').filter({ hasText: 'Alex Silva' })).toContainText('Sem resposta');

  await guestContext.close();
});