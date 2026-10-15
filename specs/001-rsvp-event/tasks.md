---
description: "Lista de tarefas para implementação da feature RSVP de Festa"
---

# Tasks: RSVP de Festa

**Input**: Documentos de design em `/specs/001-rsvp-event/`

**Prerequisites**: `plan.md` e `spec.md`; também considerar `research.md`, `data-model.md`, `contracts/` e `quickstart.md`.

**Tests**: Incluídos para atender à Constituição do projeto, ao gate obrigatório das Security Rules e aos fluxos verificáveis definidos no plano.

**Organization**: Tarefas agrupadas por história para rastreabilidade e validação incremental.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicializar a aplicação web e as ferramentas de desenvolvimento.

- [X] T001 Criar o scaffold JavaScript com React e Vite em `package.json`, `index.html`, `vite.config.js` e `src/main.jsx`.
- [X] T002 [P] Configurar Tailwind CSS e estilos globais em `tailwind.config.js`, `postcss.config.js` e `src/index.css`.
- [X] T003 Configurar scripts e ferramentas de teste unitário, componentes e navegador em `package.json`, `vitest.config.js`, `playwright.config.js` e `tests/setup.js`.
- [X] T004 [P] Atualizar `specs/001-rsvp-event/research.md` para refletir decisões aprovadas de e-mail/senha, foto opcional do espaço, URL HTTPS, tokens revogáveis e ausência de serviços pagos ou processamento em segundo plano.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Preparar Firebase, caminhos de dados e validação de segurança que bloqueiam as histórias.

- [X] T005 Configurar Authentication e Realtime Database Emulator sem habilitar billing em `firebase.json`, `.env.example` e `.gitignore`.
- [X] T006 Inicializar Firebase Web SDK a partir de variáveis públicas de ambiente e falhar claramente quando faltarem configurações em `src/services/firebase/client.js`.
- [X] T007 Centralizar caminhos públicos e privados de eventos, convidados, inbox e capacidades de edição em `src/services/firebase/paths.js`.
- [X] T008 [P] Escrever testes de Rules para isolamento entre anfitriões, leitura pública publicada, rascunhos do proprietário, índice de eventos por UID e negação por padrão em `tests/rules/database.rules.test.js`.
- [X] T009 Implementar Security Rules de proprietário, conteúdo publicado e negação de leitura anônima dos dados privados em `database.rules.json`, fazendo passar `tests/rules/database.rules.test.js`.

**Checkpoint**: Emuladores e Rules base testados; histórias podem começar.

---

## Phase 3: User Story 1 - Preparar e divulgar o evento (Priority: P1)

**Goal**: Permitir ao anfitrião criar conta, preparar o evento e publicar um link compartilhável.

**Independent Test**: Criar anfitrião no emulador, entrar, criar evento com título/data/horário/local, revisar conteúdo, publicar e abrir o link e QR Code em outro dispositivo; verificar logout, redefinição por e-mail e propriedade do evento.

### Tests for User Story 1

- [X] T010 [P] [US1] Criar testes Playwright de cadastro, entrada, saída e solicitação de redefinição por e-mail em `tests/e2e/host-auth.spec.js`.
- [X] T011 [P] [US1] Criar testes Playwright de criação, edição, validação e publicação de evento; verificar na prévia que o link de direções codifica o endereço informado antes da publicação em `tests/e2e/host-event-setup.spec.js`.
- [X] T012 [P] [US1] Criar testes Playwright para link público, QR Code, WhatsApp e e-mail em `tests/e2e/event-sharing.spec.js`.

### Implementation for User Story 1

- [X] T013 [P] [US1] Implementar cadastro, login, logout e redefinição de senha do anfitrião por Firebase Authentication em `src/features/auth/authService.js`.
- [X] T014 [US1] Criar formulários de autenticação e estados de erro/carregamento do anfitrião em `src/features/auth/AuthPage.jsx`.
- [X] T015 [US1] Implementar repositório de eventos com `eventId` aleatório, `ownerUid` imutável e estados rascunho/publicado em `src/features/event/eventRepository.js`.
- [X] T016 [US1] Criar fluxo de evento com validação obrigatória de título, data e horário e edição de descrição/textos em `src/features/event/EventEditor.jsx`.
- [X] T017 [US1] Implementar galeria administrável com URLs HTTPS, texto alternativo por foto informativa, prévia e fallback em `src/features/event/EventGalleryEditor.jsx`.
- [X] T018 [US1] Implementar endereço, foto HTTPS opcional do espaço e texto alternativo em `src/features/event/LocationEditor.jsx`; construir em `src/features/event/mapsUrl.js` o link de direções com o endereço codificado e permitir que o anfitrião revise o destino antes da publicação, sem Maps API.
- [X] T019 [US1] Revisar e fixar uma dependência QR client-side mantida em `package.json`; gerar QR do link canônico e preparar compartilhamentos `wa.me` e `mailto:` em `src/features/sharing/shareService.js` e `src/features/sharing/SharePanel.jsx`.

**Checkpoint**: Anfitrião consegue autenticar-se, publicar evento e compartilhar o acesso sem serviços pagos de mapas ou imagens.

---

## Phase 4: User Story 2 - Consultar o evento e responder (Priority: P1)

**Goal**: Permitir que convidados consultem conteúdo publicado e enviem/editem RSVP sem conta, mantendo inbox e respostas privadas.

**Independent Test**: Abrir evento publicado como visitante anônimo, verificar que só conteúdo público é legível, enviar RSVP e mensagem de até 500 caracteres, editar pelo link individual, testar link inválido/revogado e confirmar isolamento no Emulator Suite.

### Tests for User Story 2

- [X] T020 [P] [US2] Criar testes Playwright da página pública e envio anônimo de RSVP/mensagem; verificar ausência de rolagem horizontal nos viewports de 360 px e 1280 px, aviso sobre provedores externos e fallback quando uma imagem falhar em `tests/e2e/guest-rsvp.spec.js`.
- [X] T021 [P] [US2] Testar que visitante anônimo só cria submissão válida e não lê inbox, roster, mensagens ou outros RSVP em `tests/rules/guest-rsvp.rules.test.js`.
- [X] T022 [P] [US2] Criar testes Playwright de leitura, edição individual, revogação e token inválido em `tests/e2e/guest-rsvp-edit.spec.js`.

### Implementation for User Story 2

- [X] T023 [US2] Estender as Security Rules para criação anônima validada na inbox e leitura/edição pelo token somente no RSVP correspondente em `database.rules.json`, fazendo passar `tests/rules/guest-rsvp.rules.test.js`.
- [X] T024 [P] [US2] Implementar leitura somente de `publicEvents/{eventId}` e nunca consultar caminhos privados na página pública em `src/features/event/publicEventRepository.js`.
- [X] T025 [US2] Criar página pública responsiva com estados de carregamento, evento inexistente/não publicado, galeria, localização e aviso visível de que provedores de imagens externas podem receber IP e metadados de carregamento, sem bloquear as imagens, em `src/features/event/PublicEventPage.jsx`.
- [X] T026 [US2] Implementar criação de submissão somente para evento publicado, com nome obrigatório, decisão `confirmed` ou `declined`, mensagem opcional de até 500 caracteres e sem leitura da inbox em `src/features/rsvp/rsvpSubmissionService.js`.
- [X] T027 [US2] Implementar capacidade de edição aleatória e de alta entropia, limitada a um `submissionId`, sem expiração automática e sem registrar token em analytics em `src/features/rsvp/editCapabilityService.js`.
- [X] T028 [US2] Criar formulário anônimo de RSVP e mensagem associada, rejeitando payload inválido/maior que 500 caracteres e preservando dados para nova tentativa em `src/features/rsvp/GuestRsvpForm.jsx`.
- [X] T029 [US2] Implementar abertura e gravação do RSVP pelo token individual; alterar o mesmo registro, bloquear leitura/edição de outro RSVP e colocar nome alterado em revisão em `src/features/rsvp/EditRsvpPage.jsx`.

**Checkpoint**: Convidado sem conta completa e edita o próprio RSVP; Rules negam leitura de dados privados alheios.

---

## Phase 5: User Story 3 - Acompanhar respostas e organizar a lista (Priority: P2)

**Goal**: Permitir ao anfitrião cadastrar até 100 convidados, resolver a inbox, acompanhar estados/mensagens e exportar confirmados.

**Independent Test**: Cadastrar convidados até o limite, enviar respostas únicas, duplicadas e sem correspondência, resolver/excluir submissões, desconectar e reabrir a gestão, e exportar CSV contendo todos e somente os confirmados.

### Tests for User Story 3

- [X] T030 [P] [US3] Criar testes unitários para normalização de caixa, espaços e Unicode canônico preservando acentos/pontuação em `tests/unit/normalize-name.test.js`.
- [X] T031 [P] [US3] Criar testes Playwright para estados, inbox offline, revisão manual e mensagens privadas; medir que uma submissão aceita aparece em até cinco segundos com a gestão aberta e que submissões offline aparecem ao reabri-la em `tests/e2e/host-rsvp-management.spec.js`.
- [X] T032 [P] [US3] Testar nas Security Rules que o 101º convidado é rejeitado sem apagar ou alterar os 100 existentes em `tests/rules/guest-management.rules.test.js`.
- [X] T033 [P] [US3] Criar testes unitários de CSV que validem somente confirmados, ausência de mensagens e preservação de caracteres especiais em `tests/unit/confirmed-guests-csv.test.js`.

### Implementation for User Story 3

- [X] T034 [P] [US3] Implementar normalização determinística ignorando caixa, espaços externos/repetidos e equivalência Unicode canônica, preservando acentos e pontuação em `src/features/guests/normalizeName.js`.
- [X] T035 [US3] Implementar cadastro/consulta de convidados com máximo de 100 por evento e estados `pending`, `confirmed` e `declined` em `src/features/guests/guestRepository.js`.
- [X] T036 [US3] Estender as Security Rules para impedir a criação do 101º convidado e manter operações privadas do roster limitadas ao proprietário em `database.rules.json`, fazendo passar `tests/rules/guest-management.rules.test.js`.
- [X] T037 [US3] Criar painel do anfitrião com totais/listas por estado e listener da inbox somente enquanto a gestão estiver aberta em `src/features/guests/HostDashboard.jsx`.
- [X] T038 [US3] Implementar associação automática de nome único, revisão manual de duplicatas e exclusão de envios sem correspondência sem alterar convidados incorretos em `src/features/guests/InboxReview.jsx`.
- [X] T039 [US3] Implementar consulta privada de mensagens associadas a RSVP, sem expor conteúdo ao convidado ou à página pública em `src/features/guests/HostMessages.jsx`.
- [X] T040 [US3] Implementar revogação e emissão de novo link de edição pelo anfitrião, invalidando o token anterior sem expiração ou reenvio automático em `src/features/guests/EditLinkControls.jsx`.
- [X] T041 [US3] Implementar exportação CSV contendo todos e somente confirmados, sem mensagens, preservando acentos e caracteres especiais em `src/features/guests/exportConfirmedGuests.js`.

**Checkpoint**: Anfitrião administra roster e inbox, acompanha respostas/mensagens e exporta confirmados.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verificar acessibilidade, desempenho, segurança e implantação sem custos não aprovados.

- [X] T042 [P] Auditar e corrigir navegação por teclado, foco visível e nomes acessíveis nos formulários e controles de `src/features/auth/`, `src/features/event/`, `src/features/rsvp/` e `src/features/guests/`.
- [X] T043 [P] Aplicar dimensões estáveis, lazy loading e fallback acessível às imagens em `src/features/event/EventGallery.jsx` e `src/features/event/LocationSection.jsx`, sem adicionar requisições de polling.
- [X] T044 [P] Criar testes Playwright para confirmar que a página pública não exibe ações administrativas e que o painel do anfitrião proprietário exibe navegação para convidados, mensagens, compartilhamento e exportação em `tests/e2e/context-navigation.spec.js`.
- [X] T045 Implementar navegação contextual na página pública e no painel do anfitrião, ocultando ações administrativas de convidados em `src/features/event/PublicEventPage.jsx` e `src/features/guests/HostDashboard.jsx`.
- [X] T046 Executar testes de Rules, unitários e Playwright e ajustar o fluxo ponta a ponta em `tests/rules/`, `tests/unit/`, `tests/e2e/` e `specs/001-rsvp-event/quickstart.md`.
- [X] T047 Documentar configuração e deploy no plano gratuito aprovado, sem habilitar billing, Maps API ou provedor de imagem pago, em `README.md`, `.env.example` e `firebase.json`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências; T001–T003 estabelecem scaffold/ferramentas e T004 alinha a pesquisa em paralelo.
- **Foundational (Phase 2)**: Depende do scaffold e do Firebase local; bloqueia todas as histórias. Testes de Rules precedem a implementação das regras.
- **User Story 1 (Phase 3)**: Depende da fundação; é o primeiro fluxo completo e publicável.
- **User Story 2 (Phase 4)**: Depende de US1 para evento publicado, link e conteúdo público; mantém submissão e edição isoladas.
- **User Story 3 (Phase 5)**: Depende das estruturas de RSVP/inbox de US2; adiciona roster e gestão sem alterar acesso público.
- **Polish (Phase 6)**: Depende das histórias que serão entregues.

### User Story Dependencies

- **US1 (P1)**: Após Phase 2; não depende de outra história.
- **US2 (P1)**: Após US1, pois usa os eventos publicados e seus links; T023 implementa as Rules exercitadas por T021 antes do fluxo anônimo.
- **US3 (P2)**: Após US2, pois associa e administra os RSVP recebidos; T032 valida o limite de roster antes de T036 alterar as Rules.
- **Extensão de gestão da US3 (Phase 8)**: Depende das estruturas de convidados, inbox e capacidade de edição já entregues em US2/US3. T060–T063 adicionam primeiro os testes; T064 implementa paths e Rules; T065 depende das Rules e implementa edição/exclusão/arquivo; T066 depende do repositório de T065 e adiciona mesclagem/remoção individual de acompanhantes; T067 depende das operações do repositório; T068 depende de todas as tarefas da extensão.

### Parallel Opportunities

- Setup: T002 e T004 podem ocorrer em paralelo após T001; T003 pode iniciar após T001.
- Foundation: T008 é o teste inicial das Rules e bloqueia T009; T006/T007 são sequenciais após T005.
- US1: T010–T012 podem ser escritos em paralelo; implementação de galeria (T017), localização (T018) e compartilhamento (T019) usa arquivos distintos após autenticação e evento base.
- US2: T020–T022 podem ser escritos em paralelo; após T023, T024 e T027 atuam em arquivos distintos.
- US3: T030–T033 podem ser escritos em paralelo; T034 é requisito para matching em T038; T032 deve passar antes de T036.
- Extensão da US3: T060–T063 podem ser escritos em paralelo em arquivos de teste distintos. Após os testes, T064 implementa Rules e paths; T065 deve passar antes de T066; T067 integra as operações depois de T065–T066; T068 executa a validação completa.
- Polish: T042, T043 e T044 podem ser preparados em paralelo após as histórias; T045 depende dos testes T044 e da auditoria T042, pois altera os mesmos componentes; T046 executa a suíte completa após T045.

### Parallel Example: User Story 2

```text
Após Phase 2, preparar em paralelo:
T020 testes Playwright da página pública e submissão
T021 testes de Rules para visitante anônimo
T022 testes Playwright do token de edição

Depois de T023 (Rules), implementar T024 (leitura pública) e T027 (capacidade individual) em paralelo.
```

### Parallel Example: User Story 3 guest management extension

```text
Após a gestão atual de US3, escrever em paralelo:
T060 testes de Security Rules para arquivo inativo e remoção de capacidade
T061 testes de operações de convidados em guest-repository.test.js
T062 testes de projeção de inativos e deduplicação em participant-list.test.js
T063 testes E2E de edição, exclusão e mesclagem em host-rsvp-management.spec.js

Depois dos testes:
T064 implementa Rules e caminhos privados
T065 implementa edição, exclusão e inativação
T066 implementa mesclagem e remoção de acompanhantes
T067 integra as ações na UI após as operações do repositório
T068 roda a validação completa
```

## Implementation Strategy

### MVP de Ponta a Ponta

1. Completar Setup e Foundational, incluindo Rules testadas no emulador.
2. Completar US1 para criar e publicar evento.
3. Completar US2 para fechar o ciclo essencial de consulta e RSVP anônimo.
4. Validar esse fluxo antes de iniciar US3; US1 sozinho permite publicar, mas não entrega o RSVP.

### Incremental Delivery

1. Setup + Foundational: ambiente local e fronteiras de autorização prontos.
2. US1: anfitrião autentica, publica e compartilha evento.
3. US2: convidado lê conteúdo público e envia/edita somente o próprio RSVP.
4. US3: anfitrião acompanha lista, resolve inbox e exporta confirmados.
5. Polish: acessibilidade, regressões, limites Spark e deploy sem billing não aprovado.

### Incremento da gestão de convidados

1. Executar T060–T063 para fixar as regras de acesso e o comportamento esperado.
2. Implementar T064–T066: Rules privadas, edição/exclusão, arquivo inativo, mesclagem e remoção individual.
3. Integrar controles acessíveis e confirmações em T067.
4. Executar T068; demonstrar edição, exclusão segura, 100 convidados ativos com inativos presentes, mesclagem sem duplicatas e bloqueio de conflitos.

## Notes

- Cada tarefa segue `- [ ] T### [P?] [US#?] descrição com caminho de arquivo`.
- `[P]` indica arquivos independentes sem dependência de tarefa incompleta; tarefas de histórias sempre usam `[US1]`, `[US2]` ou `[US3]`.
- Implementar primeiro os testes de cada história e confirmar que falham antes do código correspondente.
- A liberação de produção exige testes de Security Rules e validação do limite real do Spark; o emulador não comprova quotas de produção.

## Phase 7: Convergence

- [X] T048 Documentar a aceitação explícita dos advisories restantes das dependências de desenvolvimento, manter a versão aprovada da Firebase CLI e registrar a validação de segurança em `package.json`, `package-lock.json` e `specs/001-rsvp-event/research.md`.
- [X] T049 Traduzir para português brasileiro o comentário explicativo em `.env.example`, conforme a restrição de idioma da Constituição.
- [X] T050 Orientar o convidado a conferir o nome digitado ou contatar o anfitrião quando a resposta não tiver correspondência, sem revelar a lista privada, em `src/features/rsvp/GuestRsvpForm.jsx` e `tests/e2e/guest-rsvp.spec.js`.
- [X] T051 Fixar a versão LTS de Node.js e alinhar a declaração do runtime e instruções em `.nvmrc`, `package.json` e `README.md`.
- [ ] T052 Validar em um celular a leitura do QR Code e confirmar que ele abre o mesmo evento do link público em `specs/001-rsvp-event/quickstart.md` e `tests/e2e/event-sharing.spec.js`.
- [X] T053 Adicionar teste de regressão para falha recuperável de gravação que confirme mensagem para tentar novamente e preservação dos dados do formulário em `tests/e2e/guest-rsvp.spec.js`.
- [ ] T054 Validar em projeto Firebase real no plano Spark o Hosting, as rotas/redirects de Authentication e os limites de conexão/transferência antes da divulgação, sem vincular billing, e registrar os resultados em `specs/001-rsvp-event/quickstart.md`.
- [X] T055 Implementar RSVP com até 20 acompanhantes, validando nome/idade nas Rules e no cliente, edição pelo link individual, projeção de participantes no painel/CSV e limpeza ao recusar/reassociar em `src/features/rsvp/`, `src/features/guests/`, `database.rules.json` e `tests/`.

### Estado das pendências

- [X] T056 [US3] Permitir troca e desfazimento de associações automáticas/manuais em `src/features/guests/guestRepository.js` e `src/features/guests/InboxReview.jsx`, preservando acompanhantes, liberando cadastro anterior e impedindo sobrescrita da revisão administrativa; validar em `tests/unit/guest-repository.test.js`, `tests/rules/guest-rsvp.rules.test.js` e `tests/e2e/host-rsvp-management.spec.js`.
- [X] T057 [US3] Vincular cadastros pendentes de acompanhantes por correspondência única, herdar decisões do RSVP principal sem duplicar contagens/listas, preservar acompanhantes durante recusa e reconfirmação em `src/features/guests/guestRepository.js` e `src/features/rsvp/editCapabilityService.js`; validar Rules, exportação, painel e transições em `tests/rules/guest-rsvp.rules.test.js`, `tests/unit/participant-list.test.js` e `tests/e2e/host-rsvp-management.spec.js`.
- [X] T058 [US3] Adicionar telefone privado opcional, editável e removível em `src/features/guests/HostDashboard.jsx` e `src/features/guests/GuestPhoneEditor.jsx`; validar em `database.rules.json` e `tests/rules/guest-management.rules.test.js`, exportar somente para o convidado principal em `src/features/guests/exportConfirmedGuests.js` e testar conteúdo real do CSV em `tests/e2e/host-rsvp-management.spec.js`.
- [X] T059 [US3] Implementar leitura local de Excel/CSV, mapeamento de colunas, prévia e duplicatas em `src/features/guests/guestImport.js` e `src/features/guests/GuestImport.jsx`; gravar atomicamente em `src/features/guests/guestRepository.js`, mantendo limite e privacidade em `database.rules.json`; validar parser, concorrência e importação real em `tests/unit/guest-import.test.js`, `tests/unit/guest-import-repository.test.js` e `tests/e2e/guest-import.spec.js`.

- T048 concluído por aceitação explícita do usuário: foram aceitos 11 advisories (7 altos e 4 moderados) restritos à árvore de desenvolvimento de `firebase-tools@15.32.1`; a auditoria de dependências de produção reportou zero vulnerabilidades. O downgrade autorizado para a linha 14 resolveu para `firebase-tools@14.27.0` e elevou o total para 17, incluindo 1 crítico, então foi revertido. Reavaliar o risco ao atualizar a Firebase CLI e antes de um release.
- T052 depende de leitura física do QR Code com a câmera de um celular; o teste automatizado confirma a imagem, mas não substitui essa validação.
- T054 depende de credenciais e autorização para um projeto Firebase real no plano Spark; nenhum deploy ou configuração de produção foi realizado.

---

## Phase 8: User Story 3 - Editar, excluir e mesclar convidados (Priority: P2)

**Goal**: Permitir ao anfitrião editar dados cadastrais, excluir convidados e acompanhantes, arquivar acompanhantes vinculados como inativos e mesclar convidados principais sem perder ou duplicar RSVP e participantes.

**Independent Test**: No Firebase Emulator, editar nome/telefone sem alterar RSVP; cancelar e confirmar exclusões, verificar remoção de RSVP/link e inativação; excluir acompanhantes individualmente; mesclar cadastros sem conflito e verificar RSVP/telefone/acompanhantes; confirmar bloqueio sem gravação quando houver dois RSVPs associados ou telefones conflitantes. Validar limite de 100 convidados ativos mesmo com inativos arquivados.

### Tests for User Story 3 guest management extension

- [X] T060 [P] [US3] Adicionar testes de Rules para leitura/escrita/exclusão de `inactiveGuests`, validação do esquema inativo e remoção de capacidade de edição somente pelo proprietário em `tests/rules/guest-management.rules.test.js` e `tests/rules/guest-rsvp.rules.test.js`.
- [X] T061 [P] [US3] Adicionar testes unitários para edição somente de nome/telefone, exclusão com remoção de RSVP/capacidade, inativação de acompanhantes vinculados, exclusão individual e pré-condições/transferência de mesclagem em `tests/unit/guest-repository.test.js`.
- [X] T062 [P] [US3] Adicionar testes unitários para ocultar acompanhantes inativos das listas/totais ativos e projetar uma única entrada quando nome normalizado e idade forem iguais após mesclagem em `tests/unit/participant-list.test.js`.
- [X] T063 [P] [US3] Adicionar fluxos Playwright para edição sem alterar RSVP, exclusão cancelada/confirmada, inativação e remoção individual, mesclagem bem-sucedida e conflitos de mesclagem em `tests/e2e/host-rsvp-management.spec.js`.

### Implementation for User Story 3 guest management extension

- [X] T064 [US3] Atualizar `database.rules.json` e caminhos em `src/services/firebase/paths.js` para permitir somente ao anfitrião proprietário gerir `inactiveGuests`, validar seus campos `guestId`, `name`, `normalizedName`, `phone` e `inactiveAt`, negar acesso anônimo/de outro UID, e validar remoção de capacidades pelo `eventId` persistido em vez de `newData`.
- [X] T065 [US3] Implementar em `src/features/guests/guestRepository.js` edição cadastral e exclusão de convidado/inativo por atualização multipath; edição altera somente `name` (obrigatório, 1–100 caracteres), `normalizedName` e `phone` opcional (texto de até 40 caracteres, permitido `+`, dígitos, espaços, parênteses, ponto e hífen), sem alterar RSVP/acompanhantes; exclusão remove convidado, inbox e capacidade associadas, move cadastros espelho de acompanhantes para `inactiveGuests` com timestamp e permite apagar um inativo individualmente.
- [X] T066 [US3] Implementar em `src/features/guests/guestRepository.js` mesclagem de dois convidados principais e remoção individual de acompanhante; bloquear sem gravar se ambos tiverem RSVP ou se telefones preenchidos divergirem, preservar nome do destino e preencher telefone vazio, transferir a única resposta/capacidade/acompanhantes e reparentar cadastros espelho; deduplicar acompanhantes por nome normalizado e idade iguais e preservar os diferentes, respeitando até 20 acompanhantes por RSVP, nome de 1–100 caracteres e idade inteira de 0–120.
- [X] T067 [US3] Integrar formulários e controles acessíveis para editar, excluir, mesclar e resolver conflitos, apresentar confirmação explícita de exclusão, disponibilizar a lista privada de inativos e permitir remover cada acompanhante individual em `src/features/guests/HostDashboard.jsx`, `src/features/guests/CompanionList.jsx` e componentes de gestão em `src/features/guests/`.

**Checkpoint**: Edição preserva RSVP; exclusões são confirmadas e atômicas; inativos não aparecem como ativos nem ocupam vagas; mesclagem transfere dados sem duplicação e bloqueia conflitos antes de gravar.

---

## Phase 9: Polish & Cross-Cutting Concerns - guest management

**Purpose**: Validar a implementação de gestão avançada contra Rules, fluxos E2E, guia de validação e build.

- [X] T068 Executar `npm run test:unit`, `npm run test:rules`, `npx firebase emulators:exec --only auth,database "npm run test:e2e"`, `npm run build` e `git diff --check`; corrigir falhas em `tests/`, `database.rules.json` e `specs/001-rsvp-event/quickstart.md`.
