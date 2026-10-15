import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createDraftEvent, registerHost } from './helpers.js';

test('host reviews duplicate RSVP, reads its private message, and finds inbox after reopening', async ({ page, browser }) => {
  await registerHost(page);
  await createDraftEvent(page, 'Festa da equipe');
  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  await page.getByLabel('Nome do convidado').fill('Alex Silva');
  await page.getByRole('button', { name: 'Adicionar convidado' }).click();
  await expect(page.getByText('Convidado cadastrado.')).toBeVisible();
  await page.getByLabel('Nome do convidado').fill('Alex Silva');
  await page.getByRole('button', { name: 'Adicionar convidado' }).click();
  await expect(page.getByText('Convidado cadastrado.')).toBeVisible();
  await expect(page.getByText('2 de 100 convidados')).toBeVisible();

  await page.getByRole('button', { name: 'Evento', exact: true }).click();
  await page.getByRole('button', { name: 'Publicar evento' }).click();
  await page.getByRole('button', { name: 'Compartilhar', exact: true }).click();
  const eventUrl = await page.getByLabel('Link público do evento').inputValue();

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await guestPage.goto(eventUrl);
  await guestPage.getByLabel('Seu nome').fill('Alex Silva');
  await guestPage.getByLabel('Vou').check();
  await guestPage.getByRole('button', { name: 'Adicionar acompanhante' }).click();
  await guestPage.getByLabel('Nome do acompanhante 1').fill('Bento Silva');
  await guestPage.getByLabel('Idade do acompanhante 1').fill('7');
  await guestPage.getByRole('button', { name: 'Adicionar acompanhante' }).click();
  await guestPage.getByLabel('Nome do acompanhante 2').fill('Cecília Silva');
  await guestPage.getByLabel('Idade do acompanhante 2').fill('35');
  await guestPage.getByLabel('Mensagem ao anfitrião').fill('Preciso de opção vegetariana.');
  await guestPage.getByRole('button', { name: 'Confirmar presença' }).click();

  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  await expect(page.getByText('Revisão necessária')).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('group', { name: 'Totais de respostas' })).toContainText('Pendentes: 2');
  const inboxCompanions = page.getByRole('list', { name: 'Acompanhantes de Alex Silva' });
  await expect(inboxCompanions).toContainText('Bento Silva');
  await expect(inboxCompanions).toContainText('7 anos');
  await expect(inboxCompanions).toContainText('Cecília Silva');
  await expect(inboxCompanions).toContainText('35 anos');
  await page.getByLabel('Associar resposta de Alex Silva').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Associar resposta' }).click();
  await expect(page.getByRole('group', { name: 'Totais de respostas' })).toContainText('Confirmados: 3');
  await expect(page.getByRole('group', { name: 'Totais de respostas' })).toContainText('Pendentes: 1');
  const confirmedGroup = page.getByRole('heading', { name: 'Confirmaram', exact: true }).locator('..');
  const rosterCompanions = confirmedGroup.getByRole('list', { name: 'Acompanhantes de Alex Silva' });
  await expect(rosterCompanions).toContainText('Bento Silva');
  await expect(rosterCompanions).toContainText('7 anos');
  await expect(confirmedGroup.getByText('Bento Silva', { exact: true })).toBeVisible();
  await expect(confirmedGroup.getByText('7 anos')).toBeVisible();
  await expect(confirmedGroup.getByText('Cecília Silva', { exact: true })).toBeVisible();
  await expect(confirmedGroup.getByText('35 anos')).toBeVisible();
  await page.getByRole('button', { name: 'Exportar confirmados', exact: true }).click();
  const exportPreview = page.getByRole('table', { name: 'Prévia de confirmados' });
  await expect(exportPreview).toContainText('Alex Silva');
  await expect(exportPreview).toContainText('Bento Silva');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('convidados-confirmados.csv');
  const csv = await readFile(await download.path(), 'utf8');
  expect(csv).toContain('"Alex Silva","","","","Confirmado"');
  expect(csv).toContain('"Bento Silva","7","","Alex Silva","Confirmado"');
  expect(csv).toContain('"Cecília Silva","35","","Alex Silva","Confirmado"');

  await page.getByRole('button', { name: 'Mensagens' }).click();
  await expect(page.getByText('Preciso de opção vegetariana.')).toBeVisible();
  await expect(page.getByText('Alex Silva')).toBeVisible();

  await page.getByRole('button', { name: 'Voltar aos eventos' }).click();
  await guestPage.goto(eventUrl);
  await guestPage.getByLabel('Seu nome').fill('Nome sem cadastro');
  await guestPage.getByLabel('Vou').check();
  await guestPage.getByLabel('Mensagem ao anfitrião').fill('Resposta recebida fora da gestão.');
  await guestPage.getByRole('button', { name: 'Confirmar presença' }).click();
  await expect(guestPage.getByRole('heading', { name: 'Resposta enviada' })).toBeVisible();
  await page.getByRole('button', { name: 'Festa da equipe' }).click();
  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  await expect(page.getByText('Nome sem cadastro', { exact: true })).toBeVisible();
  await expect(page.getByText('Resposta recebida fora da gestão.')).toBeVisible();
  await page.getByRole('button', { name: 'Excluir envio' }).click();
  await expect(page.getByText('Nome sem cadastro', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Totais de respostas' })).toContainText('Pendentes: 1');

  await guestContext.close();
});

test('host edits, deletes, deactivates, removes companions, and merges expected guests', async ({ page, browser }) => {
  await registerHost(page);
  await createDraftEvent(page, 'Festa de gestão de convidados');
  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  for (const name of ['Alex Silva', 'Beatriz Lima', 'Rafael Costa', 'Lia Costa', 'Caio Silva']) {
    await page.getByLabel('Nome do convidado').fill(name);
    await page.getByRole('button', { name: 'Adicionar convidado' }).click();
    await expect(page.getByText('Convidado cadastrado.')).toBeVisible();
  }
  await page.getByRole('button', { name: 'Evento', exact: true }).click();
  await page.getByRole('button', { name: 'Publicar evento' }).click();
  await page.getByRole('button', { name: 'Compartilhar', exact: true }).click();
  const eventUrl = await page.getByLabel('Link público do evento').inputValue();

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await guestPage.goto(eventUrl);
  await guestPage.getByLabel('Seu nome').fill('Alex Silva');
  await guestPage.getByLabel('Vou').check();
  await guestPage.getByRole('button', { name: 'Adicionar acompanhante' }).click();
  await guestPage.getByLabel('Nome do acompanhante 1').fill('Caio Silva');
  await guestPage.getByLabel('Idade do acompanhante 1').fill('8');
  await guestPage.getByRole('button', { name: 'Confirmar presença' }).click();
  await expect(guestPage.getByRole('heading', { name: 'Resposta enviada' })).toBeVisible();

  await guestPage.goto(eventUrl);
  await guestPage.getByLabel('Seu nome').fill('Rafael Costa');
  await guestPage.getByLabel('Vou').check();
  await guestPage.getByRole('button', { name: 'Adicionar acompanhante' }).click();
  await guestPage.getByLabel('Nome do acompanhante 1').fill('Lia Costa');
  await guestPage.getByLabel('Idade do acompanhante 1').fill('6');
  await guestPage.getByRole('button', { name: 'Confirmar presença' }).click();
  await expect(guestPage.getByRole('heading', { name: 'Resposta enviada' })).toBeVisible();

  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  const alexRow = page.locator('.management-row').filter({ hasText: 'Alex Silva' }).first();
  await alexRow.getByRole('button', { name: 'Editar convidado' }).click();
  const editForm = page.locator('form[aria-label="Editar Alex Silva"]');
  await editForm.getByLabel('Nome').fill('Alex Souza');
  await editForm.getByLabel('Telefone').fill('+55 (11) 90000-0000');
  await page.getByRole('button', { name: 'Salvar edição' }).click();
  await expect(page.getByText('Cadastro atualizado.')).toBeVisible();

  page.once('dialog', (dialog) => dialog.dismiss());
  const rafaelEntry = page.locator('.guest-groups .management-row').filter({ hasText: 'Rafael Costa' });
  await rafaelEntry.getByRole('button', { name: 'Excluir convidado' }).click();
  await expect(rafaelEntry).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await rafaelEntry.getByRole('button', { name: 'Excluir convidado' }).click();
  await expect(rafaelEntry).toHaveCount(0);
  const inactiveRow = page.locator('section[aria-labelledby="inactive-guests-title"] .management-row').filter({ hasText: 'Lia Costa' });
  await expect(inactiveRow).toContainText('Inativo');
  page.once('dialog', (dialog) => dialog.accept());
  await inactiveRow.getByRole('button', { name: 'Excluir acompanhante inativo' }).click();
  await expect(inactiveRow).toHaveCount(0);

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Excluir acompanhante Caio Silva' }).click();
  await expect(page.getByRole('button', { name: 'Excluir acompanhante Caio Silva' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Editar telefone de Beatriz Lima' }).click();
  await page.getByLabel('Telefone de Beatriz Lima').fill('+55 (21) 90000-0000');
  await page.getByRole('button', { name: 'Salvar telefone' }).click();
  await page.getByLabel('Convidado a remover').selectOption({ label: 'Alex Souza' });
  await page.getByLabel('Convidado que será mantido').selectOption({ label: 'Beatriz Lima' });
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Mesclar convidados' }).click();
  await expect(page.getByRole('alert').first()).toContainText('telefones diferentes');
  await expect(page.locator('.guest-groups .management-row').filter({ hasText: 'Alex Souza' })).toHaveCount(1);

  await page.getByRole('button', { name: 'Editar telefone de Beatriz Lima' }).click();
  await page.getByLabel('Telefone de Beatriz Lima').fill('');
  await page.getByRole('button', { name: 'Salvar telefone' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Mesclar convidados' }).click();
  await expect(page.locator('.guest-groups .management-row').filter({ hasText: 'Alex Souza' })).toHaveCount(0);
  await expect(page.locator('.guest-groups .management-row').filter({ hasText: 'Beatriz Lima' })).toContainText('Confirmada');

  await guestContext.close();
});

test('host can manually associate a renamed RSVP and release its previous guest', async ({ page, browser }) => {
  await registerHost(page);
  await createDraftEvent(page, 'Festa com nome corrigido');
  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  await page.getByLabel('Nome do convidado').fill('Alex Silva');
  await page.getByRole('button', { name: 'Adicionar convidado' }).click();
  await expect(page.getByText('Convidado cadastrado.')).toBeVisible();
  await page.getByLabel('Nome do convidado').fill('Beatriz Lima');
  await page.getByRole('button', { name: 'Adicionar convidado' }).click();
  await expect(page.getByText('Convidado cadastrado.')).toBeVisible();
  await page.getByRole('button', { name: 'Evento', exact: true }).click();
  await page.getByRole('button', { name: 'Publicar evento' }).click();
  await page.getByRole('button', { name: 'Compartilhar', exact: true }).click();
  const eventUrl = await page.getByLabel('Link público do evento').inputValue();

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await guestPage.goto(eventUrl);
  await guestPage.getByLabel('Seu nome').fill('Alex Silva');
  await guestPage.getByLabel('Vou').check();
  await guestPage.getByRole('button', { name: 'Confirmar presença' }).click();
  const editUrl = await guestPage.getByRole('link', { name: 'Editar minha resposta' }).getAttribute('href');
  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Totais de respostas' })).toContainText('Confirmados: 1');
  await guestPage.goto(editUrl);
  await guestPage.getByLabel('Seu nome').fill('Alex Souza');
  await guestPage.getByRole('button', { name: 'Confirmar presença' }).click();
  await expect(guestPage.getByRole('status')).toContainText('Resposta atualizada');

  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  await expect(page.getByText('Revisão necessária')).toBeVisible();
  await page.getByLabel('Associar resposta de Alex Souza').selectOption({ label: 'Beatriz Lima' });
  await page.getByRole('button', { name: 'Associar resposta' }).click();
  await expect(page.getByRole('group', { name: 'Totais de respostas' })).toContainText('Confirmados: 1');
  await expect(page.getByRole('group', { name: 'Totais de respostas' })).toContainText('Pendentes: 1');
  await expect(page.getByRole('heading', { name: 'Confirmaram', exact: true }).locator('..')).toContainText('Beatriz Lima');
  await expect(page.getByRole('heading', { name: 'Pendentes', exact: true }).locator('..')).toContainText('Alex Silva');

  await guestContext.close();
});

test('host corrects automatic associations and edits private phone exported with companions', async ({ page, browser }) => {
  await registerHost(page);
  await createDraftEvent(page, 'Festa com correção administrativa');
  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  for (const [name, phone] of [['Alex Silva', '(11) 99999-0000'], ['Beatriz Lima', '+55 (21) 98888-0000']]) {
    await page.getByLabel('Nome do convidado').fill(name);
    await page.getByLabel('Telefone (opcional)', { exact: true }).fill(phone);
    await page.getByRole('button', { name: 'Adicionar convidado', exact: true }).click();
    await expect(page.getByText('Convidado cadastrado.')).toBeVisible();
  }
  await page.getByRole('button', { name: 'Evento', exact: true }).click();
  await page.getByRole('button', { name: 'Publicar evento' }).click();
  await page.getByRole('button', { name: 'Compartilhar', exact: true }).click();
  const eventUrl = await page.getByLabel('Link público do evento').inputValue();
  const context = await browser.newContext();
  const guest = await context.newPage();
  await guest.goto(eventUrl);
  await guest.getByLabel('Seu nome').fill('Alex Silva');
  await guest.getByLabel('Vou').check();
  await guest.getByRole('button', { name: 'Adicionar acompanhante' }).click();
  await guest.getByLabel('Nome do acompanhante 1').fill('Bento Silva');
  await guest.getByLabel('Idade do acompanhante 1').fill('7');
  await guest.getByRole('button', { name: 'Confirmar presença' }).click();
  const editUrl = await guest.getByRole('link', { name: 'Editar minha resposta' }).getAttribute('href');
  await expect(guest.getByText('(11) 99999-0000')).toHaveCount(0);
  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  const confirmed = page.getByRole('heading', { name: 'Confirmaram', exact: true }).locator('..');
  const pending = page.getByRole('heading', { name: 'Pendentes', exact: true }).locator('..');
  const counts = page.getByRole('group', { name: 'Totais de respostas' });
  await expect(confirmed).toContainText('Alex Silva');
  await expect(counts).toContainText('Confirmados: 2');
  await page.getByLabel('Associar resposta de Alex Silva').selectOption({ label: 'Beatriz Lima' });
  await page.getByRole('button', { name: 'Trocar associação', exact: true }).click();
  await expect(confirmed).toContainText('Beatriz Lima');
  await expect(confirmed).toContainText('Bento Silva');
  await expect(pending).toContainText('Alex Silva');
  await page.getByRole('button', { name: 'Editar telefone de Beatriz Lima' }).click();
  await page.getByLabel('Telefone de Beatriz Lima', { exact: true }).fill('+55 (21) 97777-0000');
  await page.getByRole('button', { name: 'Salvar telefone' }).click();
  await expect(confirmed).toContainText('+55 (21) 97777-0000');
  await page.reload();
  await page.getByRole('button', { name: 'Festa com correção administrativa' }).click();
  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  await expect(confirmed).toContainText('Beatriz Lima');
  await expect(counts).toContainText('Confirmados: 2');
  await page.getByRole('button', { name: 'Exportar confirmados', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar CSV' }).click();
  const csv = await readFile(await (await downloadPromise).path(), 'utf8');
  expect(csv).toContain('"Beatriz Lima","","+55 (21) 97777-0000","","Confirmado"');
  expect(csv).toContain('"Bento Silva","7","","Beatriz Lima","Confirmado"');
  expect(csv).not.toContain('"Alex Silva"');
  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  await page.getByRole('button', { name: 'Editar telefone de Beatriz Lima' }).click();
  await page.getByLabel('Telefone de Beatriz Lima', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Salvar telefone' }).click();
  await expect(confirmed).toContainText('Telefone: Não informado');
  await page.getByRole('button', { name: 'Desfazer associação', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Respostas recebidas', exact: true }).locator('..').locator('..')).toContainText('Revisão necessária');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(counts).toContainText('Confirmados: 0');
  await expect(counts).toContainText('Pendentes: 2');
  await page.reload();
  await page.getByRole('button', { name: 'Festa com correção administrativa' }).click();
  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  await expect(counts).toContainText('Confirmados: 0');
  await guest.goto(editUrl);
  await guest.getByRole('button', { name: 'Confirmar presença' }).click();
  await expect(guest.getByRole('status')).toContainText('Resposta atualizada');
  await expect(counts).toContainText('Confirmados: 0');
  await page.getByLabel('Associar resposta de Alex Silva').selectOption({ label: 'Beatriz Lima' });
  await page.getByRole('button', { name: 'Associar resposta', exact: true }).click();
  await expect(confirmed).toContainText('Beatriz Lima');
  await expect(counts).toContainText('Confirmados: 2');
  await context.close();
});

test('registered companion inherits the principal RSVP and never appears pending', async ({ page, browser }) => {
  await registerHost(page);
  await createDraftEvent(page, 'Acompanhante herda resposta');
  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  for (const name of ['Alex Silva', 'Bento Silva']) {
    await page.getByLabel('Nome do convidado').fill(name);
    await page.getByRole('button', { name: 'Adicionar convidado' }).click();
    await expect(page.getByText('Convidado cadastrado.')).toBeVisible();
  }
  await page.getByRole('button', { name: 'Evento', exact: true }).click();
  await page.getByRole('button', { name: 'Publicar evento' }).click();
  await page.getByRole('button', { name: 'Compartilhar', exact: true }).click();
  const eventUrl = await page.getByLabel('Link público do evento').inputValue();
  const context = await browser.newContext();
  const guest = await context.newPage();
  await guest.goto(eventUrl);
  await guest.getByLabel('Seu nome').fill('Alex Silva');
  await guest.getByLabel('Vou').check();
  await guest.getByRole('button', { name: 'Adicionar acompanhante' }).click();
  await guest.getByLabel('Nome do acompanhante 1').fill('Bento Silva');
  await guest.getByLabel('Idade do acompanhante 1').fill('7');
  await guest.getByRole('button', { name: 'Confirmar presença' }).click();
  const editUrl = await guest.getByRole('link', { name: 'Editar minha resposta' }).getAttribute('href');

  await page.getByRole('button', { name: 'Convidados', exact: true }).click();
  const counts = page.getByRole('group', { name: 'Totais de respostas' });
  await expect(counts).toContainText('Pendentes: 0');
  await expect(counts).toContainText('Confirmados: 2');
  const pending = page.getByRole('heading', { name: 'Pendentes', exact: true }).locator('..');
  await expect(pending).not.toContainText('Bento Silva');
  const confirmed = page.getByRole('heading', { name: 'Confirmaram', exact: true }).locator('..');
  const companions = confirmed.getByRole('list', { name: 'Acompanhantes de Alex Silva' });
  await expect(companions).toContainText('Bento Silva');

  await guest.goto(editUrl);
  await guest.getByLabel('Não posso').check();
  await guest.getByRole('button', { name: 'Confirmar resposta' }).click();
  await expect(guest.getByRole('status')).toContainText('Resposta atualizada');
  await expect(counts).toContainText('Pendentes: 0');
  await expect(counts).toContainText('Confirmados: 0');
  await expect(counts).toContainText('Recusados: 2');
  const declined = page.getByRole('heading', { name: 'Recusaram', exact: true }).locator('..');
  await expect(declined).toContainText('Alex Silva');
  await expect(declined.getByRole('list', { name: 'Acompanhantes de Alex Silva' })).toContainText('Bento Silva');
  await expect(pending).not.toContainText('Bento Silva');

  await guest.goto(editUrl);
  await guest.getByLabel('Vou').check();
  await guest.getByRole('button', { name: 'Confirmar presença' }).click();
  await expect(guest.getByRole('status')).toContainText('Resposta atualizada');
  await expect(counts).toContainText('Pendentes: 0');
  await expect(counts).toContainText('Confirmados: 2');
  await expect(declined).not.toContainText('Bento Silva');
  await context.close();
});

test('host searches and filters the guest presentation without changing totals or inactive guests', async ({ page }) => {
  await registerHost(page);
  await createDraftEvent(page, 'Busca de convidados');
  await page.getByRole('button', { name: 'Convidados', exact: true }).click();

  for (const name of ['Ana Silva', 'Ana Souza', 'Bruna Lima']) {
    await page.getByLabel('Nome do convidado').fill(name);
    await page.getByRole('button', { name: 'Adicionar convidado' }).click();
    await expect(page.getByText('Convidado cadastrado.')).toBeVisible();
  }

  const groups = page.locator('.guest-groups');
  await page.getByLabel('Buscar convidados').fill('  aNa   sIlVa ');
  await expect(groups).toContainText('Ana Silva');
  await expect(groups).not.toContainText('Ana Souza');
  await expect(groups).not.toContainText('Bruna Lima');
  await expect(page.locator('.guest-limit')).toHaveText('3 de 100 convidados');

  await page.getByLabel('Filtrar por status').selectOption('declined');
  await expect(groups).toContainText('Nenhum convidado corresponde aos filtros.');
  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(groups).toContainText('Ana Silva');
  await expect(groups).toContainText('Ana Souza');
  await expect(groups).toContainText('Bruna Lima');
  await expect(page.getByRole('heading', { name: 'Acompanhantes inativos' })).toBeVisible();
});