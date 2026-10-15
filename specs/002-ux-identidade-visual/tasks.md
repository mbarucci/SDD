---

description: "Tarefas de implementação do redesign de usabilidade e identidade visual"
---

# Tarefas: Usabilidade e identidade visual para eventos de família

**Input**: Documentos de design em `specs/002-ux-identidade-visual/`

**Pré-requisitos**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/ui-contracts.md` e `quickstart.md`

**Testes**: Incluídos por exigência de verificabilidade da constituição e dos critérios de aceitação. Em cada história, criar/executar primeiro as tarefas de teste aplicáveis e verificar que detectam a falta da implementação antes de concluir a implementação. Não alterar verificações existentes para enfraquecer asserts.

**Organização**: Fases por história de usuário; a aprovação visual pública é uma barreira obrigatória antes de qualquer tarefa do organizador.

## Formato

`- [ ] T001 [P] [US1] Descrição com caminho de arquivo`

- `[P]`: tarefa pode executar em paralelo sem editar o mesmo arquivo ou depender de outra tarefa incompleta.
- `[US1]`–`[US5]`: história correspondente em `spec.md`.
- Todas as tarefas indicam o(s) caminho(s) exato(s).

---

## Fase 1: Setup

**Objetivo**: Apresentar a proposta antes de qualquer implementação e preparar a tipografia local licenciada, sem adicionar dependências de runtime.

- [X] T001 Apresentar ao usuário os tokens visuais e a lista de arquivos previstos antes de alterar código ou assets; registrar a apresentação e autorização explícita para iniciar a implementação em `specs/002-ux-identidade-visual/quickstart.md`.
- [X] T002 Verificar as licenças SIL OFL 1.1, cobertura pt-BR e faixa variável 400–700 de Fraunces e DM Sans; adicionar os assets Latin WOFF2 e as licenças oficiais em `public/fonts/` e `public/fonts/licenses/`.

---

## Fase 2: Fundamentos visuais compartilhados

**Objetivo**: Centralizar os tokens aprovados sem ativar um redesign global antes da entrega pública.

- [X] T003 Definir em `src/index.css` tokens base com a paleta do usuário `#DFC5FF`, `#BCB3E8`, `#D2D6FF`, `#B3C6E8`, `#C5E9FF`, superfícies e tons escuros acessíveis, cores semânticas de confirmado/recusado/pendente, Fraunces/DM Sans, corpo de 18px, escala 4/8/16/24/32px, raios de 12/20px, sombra suave e movimento de 180ms; declarar fontes locais com fallback e `font-display: swap`, mantendo a ativação visual restrita às superfícies entregues em cada fase.

**Checkpoint**: Há tokens únicos, sem alteração de rotas, dados Firebase ou aparência administrativa antes do gate público.

---

## Fase 3: User Story 1 — Receber um convite acolhedor e legível (P1)

**Goal**: Reapresentar o convite público, primeiro em mobile, preservando a privacidade e o conteúdo existente.

**Independent Test**: Abrir `/event/{eventId}` sem login em 375px, 768px e 1280px; consultar capa ou fallback, evento, endereço/mapa e alcançar RSVP por toque e teclado.

### Testes para User Story 1

- [X] T004 [P] [US1] Adicionar testes unitários para seleção da imagem de capa, fallback e formatação local de data/hora existente em `tests/unit/event-presentation.test.js`.
- [X] T005 [P] [US1] Adicionar teste Playwright da página pública sem login, conteúdo, privacidade e ausência de rolagem horizontal em larguras 375px, 768px e 1280px em `tests/e2e/guest-invitation.spec.js`.

### Implementação para User Story 1

- [X] T006 [US1] Criar funções puras de seleção de capa e apresentação de datas com fallback seguro para eventos sem imagem ou data válida em `src/features/event/eventPresentation.js`.
- [X] T007 [US1] Criar o componente de apresentação pura do convite, sem leitura de dados, listeners ou submissão, preservando texto alternativo, localização e mapa em `src/features/event/EventInvitation.jsx`.
- [X] T008 [US1] Integrar `EventInvitation` à página pública, preservando a rota `/event/{eventId}`, conteúdo público, estado indisponível e saudação genérica sem dados do anfitrião privado em `src/features/event/PublicEventPage.jsx`.
- [X] T009 [US1] Implementar capa responsiva, composição alternativa, tipografia e hierarquia do convite em 375/768/1280px, reservando espaço da imagem e preservando legibilidade em falha de fonte/imagem; limitar as regras ao wrapper `.public-experience` em `src/index.css`, sem alterar a aparência do painel antes do gate.
- [X] T010 [US1] Criar CTA móvel “Responder ao convite” com âncora para `#rsvp`, safe-area e comportamento que não cubra formulário, foco ou confirmação, respeitando `prefers-reduced-motion` em `src/features/event/PublicRsvpCta.jsx`, `src/features/event/PublicEventPage.jsx` e `src/index.css`.

**Checkpoint**: Convite público e navegação ao formulário funcionam sem acesso privado ou mudança de rota.

---

## Fase 4: User Story 2 — Responder e guardar o acesso de edição (P1)

**Goal**: Tornar resposta, sucesso e edição claras e consistentes, sem mudar os dados ou decisões RSVP.

**Independent Test**: Enviar confirmação com acompanhante e recado, guardar o link, editar a mesma resposta; repetir com recusa, link revogado e erro de rede.

### Testes para User Story 2

- [X] T011 [P] [US2] Adicionar testes unitários para campos RSVP compartilhados, rótulos “Vou”/“Não posso”, validação e preservação dos valores após falha em `tests/unit/rsvp-fields.test.jsx`.
- [X] T012 [P] [US2] Adicionar testes unitários de cópia de link com clipboard bem-sucedido, fallback selecionável e anúncio sem falso sucesso em `tests/unit/copy-link-control.test.jsx`.

### Implementação para User Story 2

- [X] T013 [US2] Criar `RsvpFields` controlado compartilhado para nome obrigatório, decisão `confirmed`/`declined`, acompanhantes `{ name, age }` com idade inteira de 0 a 120 e no máximo 20 por resposta, e mensagem de até 500 caracteres; manter alvos de decisão de pelo menos 48px em `src/features/rsvp/RsvpFields.jsx`.
- [X] T014 [US2] Criar `CopyLinkControl` acessível que copia URL absoluta por ação explícita e, se falhar, mostra URL selecionável e instrução manual sem registrar o token em logs ou compartilhamento público em `src/components/CopyLinkControl.jsx`.
- [X] T015 [US2] Integrar os campos compartilhados e o novo rótulo de confirmação à submissão existente, preservar o formulário em caso de falha e apresentar sucesso com link de edição destacado e copiável em `src/features/rsvp/GuestRsvpForm.jsx`.
- [X] T016 [US2] Reutilizar os campos compartilhados na edição, mostrar somente o resumo da resposta salva e sua data disponível em pt-BR, preservar o `submissionId` e anunciar o resultado sem inventar data em `src/features/rsvp/EditRsvpPage.jsx`.
- [X] T017 [US2] Estilizar escolhas, campos, sucesso, erro, foco e movimento reduzido das jornadas de resposta e edição com corpo de pelo menos 18px e alvos de toque de 44px, mantendo decisões de presença semanticamente identificadas e validações existentes de nome obrigatório, idade inteira de 0 a 120, no máximo 20 acompanhantes e mensagem de até 500 caracteres; limitar as regras ao wrapper `.public-experience`, sem redesenhar o painel antes do gate, em `src/index.css`.
- [X] T018 [US2] Atualizar os fluxos Playwright de resposta, edição, recusa, falha e link revogado, mantendo asserts de payload, acompanhantes, mesmo RSVP e privacidade em `tests/e2e/guest-rsvp.spec.js` e `tests/e2e/guest-rsvp-edit.spec.js`.
- [X] T019 [US2] Demonstrar Convite, Responder, Sucesso e Editar em mobile e desktop e registrar em `specs/002-ux-identidade-visual/quickstart.md` a aprovação explícita do usuário ou os ajustes solicitados; **não iniciar nenhuma tarefa das fases US3–US5 sem aprovação explícita registrada**.

**Checkpoint/Gate obrigatório**: A aprovação do usuário é dependência de todas as tarefas US3–US5. Testes verdes não substituem aprovação; pedidos de ajuste exigem nova demonstração antes de registrar aceite.

---

## Fase 5: User Story 3 — Encontrar e configurar meus eventos (P2)

**Goal**: Após aprovação da área pública, organizar acesso, lista de eventos e edição com prévia fiel.

**Independent Test**: Entrar na área existente, percorrer estados vazio/erro/lista, abrir evento e conferir cabeçalho, totais e prévia antes de salvar.

**Pré-requisito**: T019 aprovado; preservar autenticação e serviços atuais.

### Testes para User Story 3

- [X] T020 [P] [US3] Adicionar cobertura Playwright para login, cadastro, recuperação de senha e seus erros usando somente métodos existentes, além de lista vazia, eventos, cabeçalho, navegação móvel e prévia sem escrita em `tests/e2e/host-auth.spec.js`, `tests/e2e/host-event-setup.spec.js` e `tests/e2e/context-navigation.spec.js`.

### Implementação para User Story 3

- [X] T021 [US3] Preparar e expor estado de gestão por evento com prontidão, erro e cleanup de listeners ao trocar evento, impedindo dados de evento anterior ou zeros não carregados em `src/features/guests/guestRepository.js` e `src/features/guests/HostDashboard.jsx`.
- [X] T022 [US3] Redesenhar acesso, cartões/lista de eventos com capa ou fallback, data, status, resumo carregado e ação “Criar primeiro evento”, distinguindo carregamento, erro e lista vazia em `src/features/auth/AuthPage.jsx`, `src/features/guests/HostDashboard.jsx` e `src/index.css`.
- [X] T023 [US3] Reorganizar cabeçalho contextual, resumo de participantes e navegação na ordem Evento, Convidados, Mensagens, Compartilhar, Exportar confirmados; manter troca de seção identificável e acessível em mobile e desktop em `src/features/guests/HostDashboard.jsx` e `src/index.css`.
- [X] T024 [US3] Incluir prévia ao vivo alimentada apenas pelo rascunho local e reutilizando `EventInvitation`, com identificadores próprios e interações inertes, sem escrita automática ou mudança da semântica de salvar/publicar em `src/features/event/EventEditor.jsx`, `src/features/event/EventInvitation.jsx` e `src/index.css`.

**Checkpoint**: Lista, cabeçalho e prévia representam o evento atual e não alteram autenticação ou persistência.

---

## Fase 6: User Story 4 — Gerir convidados sem perder o contexto (P2)

**Goal**: Facilitar busca, filtro e leitura da lista sem interferir em contagens, dados ou operações administrativas existentes.

**Independent Test**: Buscar e filtrar homônimos, limpar filtros, consultar acompanhantes e executar operações já existentes com confirmação.

**Pré-requisito**: US3 fornece navegação e estado de evento carregado.

### Testes para User Story 4

- [X] T025 [P] [US4] Adicionar testes unitários para busca normalizada, filtros de status, lista sem resultados e preservação da projeção integral/totais em `tests/unit/guest-list-view.test.js`.
- [X] T026 [P] [US4] Adicionar teste Playwright de busca, filtro, limpeza, recados privados, ações existentes e visibilidade separada de inativos em `tests/e2e/host-rsvp-management.spec.js`.

### Implementação para User Story 4

- [X] T027 [US4] Implementar busca pelo helper existente `normalizeName` e filtros de status apenas sobre a lista renderizada, preservando roster integral, identidade/slot dos convidados e dados para associação, mesclagem e totais em `src/features/guests/HostDashboard.jsx` e `src/features/guests/participantList.js`.
- [X] T028 [US4] Reorganizar grupos/listas, badges com texto, adicionar/importar, telefones, detalhes privados e acompanhantes, distinguindo vazio, carregamento, erro e ausência de resultados filtrados em `src/features/guests/HostDashboard.jsx`, `src/features/guests/CompanionList.jsx`, `src/features/guests/GuestImport.jsx` e `src/index.css`.
- [X] T029 [US4] Adequar microtextos, foco, alvos móveis e confirmação das ações de editar, excluir, inativar, remover acompanhante, mesclar e revogar/emitir link sem mudar regras ou chamadas de repositório em `src/features/guests/HostDashboard.jsx`, `src/features/guests/CompanionList.jsx` e `src/features/guests/EditLinkControls.jsx`.

**Checkpoint**: Busca/filtros mudam apenas a apresentação; invariantes e operações dos convidados continuam funcionando.

---

## Fase 7: User Story 5 — Compartilhar, consultar mensagens e exportar (P2)

**Goal**: Completar o painel mantendo confirmação pelo usuário nos canais externos, privacidade e CSV existente.

**Independent Test**: Copiar link, abrir WhatsApp/e-mail, visualizar QR, ler mensagens recebidas e comparar prévia com CSV baixado.

**Pré-requisito**: Estado do evento e totais carregados em US3; operações de lista permanecem coerentes após US4.

### Testes para User Story 5

- [X] T030 [P] [US5] Adicionar testes de componente para erro/sucesso de cópia, disponibilidade do QR Code e estados vazio/erro de exportação sem falha silenciosa em `tests/unit/share-panel.test.jsx` e `tests/unit/confirmed-export.test.jsx`.
- [X] T031 [P] [US5] Adicionar fluxo Playwright que verifica link público, WhatsApp/e-mail, QR Code, mensagens privadas, prévia e conteúdo real do CSV em `tests/e2e/event-sharing.spec.js`, `tests/e2e/host-rsvp-management.spec.js` e `tests/e2e/host-confirmed-export.spec.js`.

### Implementação para User Story 5

- [X] T032 [US5] Reorganizar link, feedback de cópia, compartilhamento WhatsApp/e-mail e visualização do QR Code, expondo erro de clipboard/geração do QR e preservando destinos existentes em `src/features/sharing/SharePanel.jsx`, `src/components/CopyLinkControl.jsx` e `src/index.css`.
- [X] T033 [US5] Redesenhar a leitura privada de mensagens recebidas com autor, contexto temporal, estado vazio e erro, sem acrescentar modelos, lembretes, disparos ou campos novos em `src/features/guests/HostMessages.jsx` e `src/index.css`.
- [X] T034 [US5] Criar seção de exportação com prévia derivada de `confirmedParticipants` e estado explícito de carga/erro/vazio, sem substituir o roster por dados filtrados em `src/features/guests/ConfirmedExport.jsx` e `src/features/guests/participantList.js`.
- [X] T035 [US5] Integrar navegação Exportar confirmados à prévia e ao download existentes, aguardando dados do evento atual e preservando CSV UTF-8 com BOM, vírgulas, CRLF, escaping, nome `convidados-confirmados.csv` e seis colunas nesta ordem: `Nome, Idade, Telefone, Convidado principal, Situação, Data da última resposta` em `src/features/guests/HostDashboard.jsx`, `src/features/guests/ConfirmedExport.jsx` e `src/features/guests/exportConfirmedGuests.js`.

**Checkpoint**: Link/QR correspondem ao evento; mensagens permanecem privadas; prévia e arquivo CSV representam os mesmos confirmados.

---

## Fase 8: Acabamento e validação transversal

**Objetivo**: Verificar acessibilidade, responsividade, desempenho e regressões no escopo efetivamente aprovado.

- [ ] T036 [P] Verificar em todas as superfícies entregues contraste de texto ≥4,5:1, controles/foco aplicáveis ≥3:1, headings, labels, foco, status textual, microtextos em português do Brasil, zoom 200%, toque ≥44px e escolha RSVP ≥48px em `src/index.css`, `src/features/` e `tests/e2e/`.
- [X] T037 [P] Validar movimento reduzido, carregamento/falha de fontes e imagens e ausência de sobreposição horizontal em 375/768/1280px com testes Playwright em `tests/e2e/guest-invitation.spec.js`, `tests/e2e/guest-rsvp.spec.js` e `tests/e2e/host-event-setup.spec.js`.
- [ ] T038 Medir dez aberturas frias do convite em build de produção servido localmente e configurado para Firebase Emulator, em rede de referência de 10 Mbps/150ms; registrar ambiente e resultado de SC-006 em `specs/002-ux-identidade-visual/quickstart.md`, sem usar dados ou serviços de produção.
- [ ] T039 Conduzir e registrar em `specs/002-ux-identidade-visual/quickstart.md` a sessão SC-001/SC-005 com cinco pessoas, pelo menos duas com 60 anos ou mais, sem instrução passo a passo; medir conclusão em até dois minutos, identificação da resposta e do caminho de edição, e registrar ajuda/erros sem dados pessoais desnecessários.
- [X] T040 Executar `npm run test:unit`, `npm run test:rules`, `npx firebase emulators:exec --only auth,database "npm run test:e2e -- --workers=1"`, `npm run build` e `git diff --check`; registrar resultados e validações humanas pendentes em `specs/002-ux-identidade-visual/quickstart.md`.

---

## Dependências e ordem de execução

### Dependências de fases

- **Setup (Fase 1)**: T001 apresenta tokens/arquivos e registra autorização explícita; T002 só verifica/adiciona fontes após T001.
- **Fundamentos (Fase 2)**: T003 depende de T002; define tokens consumidos nas jornadas.
- **US1 (Fase 3)**: depende de T003; produz e verifica convite público responsivo.
- **US2 (Fase 4)**: depende de US1 para integrar resposta na âncora e CTA; T011/T012 podem executar em paralelo; T013/T014 podem executar em paralelo após testes, e integrações aguardam os componentes.
- **T019 — gate humano**: após toda US1/US2; aprovação explícita é pré-requisito para US3, US4 e US5. Sem aprovação, parar e aguardar decisão/ajustes.
- **US3 (Fase 5)**: depende de T019 aprovado e habilita estado de contexto para demais incrementos administrativos.
- **US4 (Fase 6)**: depende de US3 para navegação/estado carregado; preserva o roster integral.
- **US5 (Fase 7)**: depende de US3 para contexto e carga; sua exportação deve continuar coerente com a projeção de US4.
- **Polish (Fase 8)**: depende das superfícies que forem implementadas e aprovadas; execução de Rules/E2E sequencial para evitar colisões nos emuladores.

### Dependências por história

- **US1 (P1)**: independente de demais histórias após os fundamentos; demonstra convite e CTA.
- **US2 (P1)**: segue US1; reutiliza CTA, âncora e tokens, preservando serviços atuais.
- **US3 (P2)**: bloqueada até aprovação explícita de US1+US2; dependente de carregamento correto de evento.
- **US4 (P2)**: dependente de navegação e contexto carregado de US3.
- **US5 (P2)**: compartilha contexto de US3 e usa projeção/semântica CSV preservada em US4.

### Oportunidades de paralelismo seguras

- T004 e T005: testes em arquivos distintos, ambos podem ser escritos antes das implementações US1.
- T011 e T012: testes independentes de campos e controle de cópia.
- T013 e T014: componentes independentes, depois de seus testes; integrar em sequência em T015/T016.
- T020 com tarefas unitárias da US3, se adicionadas, em arquivos de teste diferentes.
- T025 e T026: projeção unitária e Playwright podem ser preparados em paralelo.
- T030 e T031: testes de componentes e E2E distintos, quando seus contratos de UI forem estabilizados.
- T036 e T037: validação estática/visual e comportamento responsivo podem avançar separadamente após as telas correspondentes.
- **Não paralelizar** tarefas que editam `src/index.css`, `HostDashboard.jsx`, `PublicEventPage.jsx`, emuladores Firebase ou `quickstart.md` ao mesmo tempo.

### Exemplos de execução paralela por história

- **US1**: preparar T004 e T005 em paralelo; depois da conclusão dos testes, continuar T006 → T007 → T008 → T009 → T010.
- **US2**: preparar T011 e T012 em paralelo; em seguida, T013 e T014 podem ser implementadas em paralelo, antes das integrações T015/T016, estilos T017 e fluxo T018.
- **US3**: T020 é tarefa de teste independente; depois, executar T021 → T022 → T023 → T024, pois tarefas de UI reutilizam arquivos do painel/estilos e dependem do estado pronto.
- **US4**: preparar T025 e T026 em paralelo; após os testes, executar T027 → T028 → T029 para evitar colisão na lista e nos estilos.
- **US5**: preparar T030 e T031 em paralelo; depois executar T032 → T033 → T034 → T035 em sequência por compartilhamento de estilos, navegação do painel e integração da exportação.

## Estratégia de implementação

1. **MVP público**: concluir US1 e US2, rodar testes públicos e demonstrar o resultado. Parar em T019 e aguardar aprovação explícita; não iniciar trabalho administrativo enquanto pendente.
2. **Painel por incremento**: após aprovação, concluir US3 e verificar estado de evento/navegação; então US4; por fim US5. Cada checkpoint deve ser demonstrável independentemente e sem alterações no schema.
3. **Acabamento**: validar contraste/teclado/responsividade e desempenho; rodar suites completas e registrar sessões humanas como realizadas ou pendentes, nunca inferidas de automação.

## Critérios independentes de aceite por história

- **US1**: Em 375px, o convidado sem login vê convite/capa ou fallback, detalhes/mapa e CTA; teclado e zoom não causam sobreposição ou corte.
- **US2**: O convidado confirma ou recusa, recebe link privado copiável e edita a mesma resposta; falha preserva os campos e link revogado não revela a resposta.
- **US3**: O organizador acessa eventos, entende estados e totais do evento atual, navega nas cinco seções e pré-visualiza rascunho sem gravar.
- **US4**: Busca/filtros e detalhes ajudam a gerir pessoas sem mudar dados, totais, acompanhante, inativo ou resultado de operações existentes.
- **US5**: O organizador compartilha o evento, consulta mensagens privadas e confere prévia equivalente ao CSV, com erros e estados vazios explícitos.
