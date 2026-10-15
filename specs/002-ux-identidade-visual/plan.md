# Implementation Plan: Usabilidade e identidade visual

**Branch**: `main` (Git real) | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md)

**Input**: Especificação e decisões aprovadas em `specs/002-ux-identidade-visual/spec.md`.

O script de preparação identifica a feature como `002-ux-identidade-visual` no campo `BRANCH`, por resolução do diretório ativo. `git branch --show-current` confirma `main`; este planejamento não cria nem troca branch e preserva as alterações anteriores no worktree.

## Summary

Redesenhar a aplicação existente para eventos familiares, começando por Convite → Responder → Editar e aguardando aprovação visual explícita antes de implementar o organizador. Preservar rotas, dados, acesso público sem login, serviços Firebase e regras administrativas da feature anterior.

Usar Fraunces para títulos, DM Sans para texto, a paleta lavanda/azul pastel fornecida pelo usuário com tons escuros acessíveis, escala consistente e controles acessíveis. Compartilhar apresentação do convite entre página pública e prévia, campos entre criação/edição do RSVP e projeções entre contagens/lista/exportação. Não adicionar estados, campos persistidos, biblioteca de componentes, integrações ou funcionalidades adiadas.

## Technical Context

**Language/Version**: JavaScript ES Modules e JSX; Node.js 24.x, conforme `package.json`.

**Primary Dependencies**: React 19, Vite 7, Tailwind CSS 4, Firebase Web SDK 12, qrcode 1.5.4 e read-excel-file 9. Nenhum shadcn/ui instalado; não adicioná-lo. Não adicionar dependências de runtime para o redesign.

**Storage**: Firebase Realtime Database existente; `publicEvents`, `privateEvents`, `hostEventIndex` e `publicEditCapabilities`, sem mudança de schema, paths ou Rules. Preferências de apresentação, busca, filtro, prévia e navegação ficam na memória.

**Testing**: Vitest, Testing Library, Playwright e Firebase Emulator Suite existentes. Testes de apresentação novos e regressão dos testes de regras/repositórios existentes; revisão manual de acessibilidade, desempenho e usabilidade.

**Target Platform**: Navegadores desktop e mobile; larguras de referência 375px, 768px e 1280px, zoom/texto 200%, teclado e movimento reduzido.

**Project Type**: Aplicação web React única, publicada no Firebase Hosting; sem backend adicional.

**Performance Goals**: Conteúdo principal visível em até 3s em 9/10 aberturas frias, conexão de 10 Mbps e latência de 150ms; animações até 250ms; sem novas leituras privadas públicas ou duplicação de listeners a cada troca de aba.

**Constraints**: Texto-base ≥18px, toque ≥44px e escolha RSVP ≥48px; contraste AA; duas decisões (`confirmed`/`declined`); acompanhantes nominais e limites atuais; não mudar lógica de negócio nem conteúdo/formato do CSV. Fontes locais com licença redistribuível; ausência de fonte ou imagem não impede usar a aplicação.

**Scale/Scope**: Uso pessoal; 5 histórias e 32 FRs, jornadas pública/edição/acesso e cinco seções administrativas. Até 100 cadastros ativos por evento e 20 acompanhantes por resposta, sem tratar esses limites como lotação física. Não pressupor limite novo de eventos.

## Constitution Check

*GATE: avaliação antes da pesquisa e novamente após o design.*

| Princípio | Antes da pesquisa | Após o design | Evidência |
|-----------|------------------|---------------|-----------|
| I. Especificação antes de implementação | PASS | PASS | Spec aprovada com três esclarecimentos; nenhum componente implementado por este comando |
| II. Rastreabilidade | PASS | PASS | Matriz de entregas/FRs abaixo, contratos e guia de validação; tarefas serão geradas separadamente |
| III. Resultados verificáveis | PASS | PASS | Testes por jornada, medições de contraste, desempenho e aprovação humana sem alegar execução futura |
| IV. Mudanças pequenas e reversíveis | PASS | PASS | Preservar código e alterações anteriores, sem reescrita; CSS público isolado antes do gate |
| V. Segurança e privacidade | PASS | PASS | Nenhum novo dado ou acesso público; não divulgar nome/e-mail administrativo; link de edição não compartilhado como convite |
| Dependências e plataforma | PASS | PASS | Manter stack e ferramentas; fontes locais licenciadas, sem framework novo |
| Idioma | PASS | PASS | Prosa dos artefatos em português do Brasil; identificadores canônicos preservados |

Não há violação que exija exceção. A aprovação visual e as sessões com usuários são gates futuros, não resultados realizados neste planejamento.

## Project Structure

### Documentation (this feature)

```text
specs/002-ux-identidade-visual/
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/ui-contracts.md
└── quickstart.md
```

`tasks.md` será produzido por `/speckit-tasks`, não por este comando.

### Source Code (repository root)

```text
src/
├── app/App.jsx                         # rotas existentes preservadas
├── index.css                           # tokens e estilos existentes
├── components/
│   └── CopyLinkControl.jsx             # novo: cópia acessível com alternativa manual
├── features/
│   ├── auth/AuthPage.jsx
│   ├── event/
│   │   ├── PublicEventPage.jsx
│   │   ├── EventInvitation.jsx          # novo: apresentação sem leitura/escrita
│   │   ├── eventPresentation.js         # novo: capa e datas de apresentação
│   │   ├── EventEditor.jsx
│   │   ├── EventGallery.jsx
│   │   ├── LocationSection.jsx
│   │   ├── EventGalleryEditor.jsx
│   │   └── LocationEditor.jsx
│   ├── rsvp/
│   │   ├── GuestRsvpForm.jsx
│   │   ├── EditRsvpPage.jsx
│   │   ├── RsvpFields.jsx               # novo: campos compartilhados, estado controlado
│   │   └── CompanionFields.jsx
│   ├── guests/
│   │   ├── HostDashboard.jsx
│   │   ├── ConfirmedExport.jsx          # novo: prévia usando projeção/CSV existentes
│   │   ├── participantList.js
│   │   ├── guestRepository.js           # somente adaptação do ciclo de leitura, se necessária
│   │   └── componentes de gestão existentes
│   └── sharing/SharePanel.jsx
public/fonts/                           # novos WOFF2 licenciados e respectivos avisos
tests/
├── unit/                               # componentes, formatação, projeções e regressões
├── e2e/                                # contratos públicos, administrativos e acessibilidade
└── rules/                              # regressão sem alterar políticas
```

**Structure Decision**: Evoluir a estrutura por features existente. Criar apenas componentes que eliminam duplicação concreta. Tokens têm uma única fonte em `src/index.css`; `tailwind.config.js` só referenciará variáveis caso utilities do novo layout precisem delas, sem uma segunda paleta.

## Phase 0: Pesquisa e decisões

Concluída em [research.md](./research.md) por inspeção do código e das ferramentas existentes e cálculo dos contrastes. Nenhuma decisão técnica permanece aberta. Sem necessidade de pesquisa externa de código ou envio de dados do projeto a terceiros.

Principais conclusões:

- Não há gradiente roxo, Inter ou shadcn/ui no código atual: há Georgia, Arial, verde/coral e CSS global. O pedido define a nova direção, não autoriza presumir a implementação existente.
- Usar violeta profundo acessível como destaque fixo junto aos cinco pastéis fornecidos; extração automática da capa é opcional na spec e fica fora desta entrega para evitar canvas/CORS e algoritmos extras.
- O resumo administrativo hoje depende de dados carregados nas abas Convidados/Mensagens. O redesign deve carregar o estado correto nas superfícies que exibem totais/exportação, nunca exibir zero por falta de carga.
- O CSV já projeta acompanhantes deduplicados; a prévia deve chamar a mesma projeção, sem nova contagem paralela.

## Phase 1: Design

### Tokens propostos

| Token | Valor | Uso |
|-------|-------|-----|
| `--paper` | `#F8F7FC` | Fundo lavanda quase branco |
| `--surface` | `#FFFFFF` | Superfície de formulário e blocos funcionais |
| `--ink` | `#29243D` | Texto ameixa escuro |
| `--muted` | `#514B68` | Texto secundário legível |
| `--accent` / `--accent-hover` | `#5B4B86` / `#483966` | Ação principal violeta profundo, texto branco |
| Cores pastel da paleta | `#DFC5FF`, `#BCB3E8`, `#D2D6FF`, `#B3C6E8`, `#C5E9FF` | Capa alternativa, divisórias, seleção e superfícies |
| `--confirmed` | `#285D45` | “Vou” / confirmado, sempre com texto |
| `--declined` | `#943D3D` | “Não posso” / recusado, sempre com texto |
| `--pending` | `#645F59` | Sem resposta, sempre com texto |
| `--border` | `#7B7795` | Contorno de campos/controles |
| `--focus` | `#365B91` | Foco acessível |
| `--font-display` | Fraunces, Georgia, serif | Títulos |
| `--font-body` | DM Sans, system-ui, sans-serif | Corpo, labels e botões |
| `--text-base` | `1.125rem` | 18px no tamanho-base padrão |
| `--space-*` | 4/8/16/24/32px em rem | Ritmo de layout |
| `--radius-control` / `--radius-panel` | 12px / 20px | Formas consistentes |
| `--shadow-soft` | `0 8px 24px rgb(41 36 61 / 9%)` | Apenas blocos com função |
| `--motion-fast` | 180ms | Feedback discreto, desativado com movimento reduzido |

Corpo com line-height 1,5–1,6; títulos responsivos sem reduzir o texto-base. Fundos claros e bordas não devem eliminar o indicador de seleção nem o foco.

Fontes auto-hospedadas em WOFF2, apenas subconjunto que cubra português e pesos usados; verificar licença e guardar os avisos junto aos arquivos. Usar `font-display: swap`, no máximo uma fonte crítica pré-carregada se medição justificar. Não buscar fontes em serviço externo durante a visita.

### Área pública: primeiro incremento

1. Extrair `EventInvitation` como apresentação pura dos dados recebidos. Manter leitura no `PublicEventPage`. Usar imagem do local HTTPS ou primeira foto, preservando texto alternativo e mapa; ausência/falha de imagem gera composição tipográfica, não estado de erro da página.
2. Priorizar a capa no mobile, com título, “Você está convidado”, data/hora/local e descrição. Não inventar anfitrião nem buscar dados privados. Não adicionar upload ou escolha persistida de capa.
3. CTA fixa no mobile com espaço reservado e safe-area. Observar a visibilidade da seção `#rsvp`; ao entrar nela, focar seus controles ou concluir o envio, esconder a barra fixa. A navegação até o formulário deve mover o foco para seu título/primeiro controle sem scroll animado obrigatório.
4. Extrair `RsvpFields` compartilhado, mantendo as páginas como donas do estado e das chamadas de serviço. Inputs radio reais com labels “Vou” e “Não posso”, estilizados como escolhas grandes; preservar nome, idade, mensagem e validações.
5. Manter `#rsvp` inclusive na confirmação, focar seu título e anunciar sucesso. Oferecer link relativo de edição e controle para copiar URL absoluta com alternativa selecionável. Nunca enviar o token como parâmetro de compartilhamento público.
6. Na edição, apresentar a decisão salva e `updatedAt`, sem mudar o resumo enquanto o usuário só edita o rascunho. Formatar o dia em pt-BR; data ausente/inválida resulta em texto explícito “Data da resposta não disponível”, não data atual inventada.
7. Isolar regras de layout e ativação tipográfica no wrapper público `.public-experience` durante este incremento. Declarar tokens/fontes é permitido, mas não redesenhar Auth/HostDashboard antes do gate.

**Gate pré-implementação**: antes de alterar código ou assets, apresentar ao usuário os tokens visuais e os arquivos previstos e registrar a apresentação e autorização explícita de início em `quickstart.md`.

**Gate obrigatório da área pública**: executar validações públicas e demonstrar Convite, Responder, Sucesso e Editar em 375px e desktop, incluindo sucesso/erro. Registrar aprovação explícita do usuário em `quickstart.md`. Se houver ajustes, repeti-los e demonstrar novamente. Não iniciar implementação administrativa nem apresentar a feature inteira como concluída antes da aprovação.

### Área do organizador: segundo incremento

Após o gate, aplicar a base visual aprovada na sequência:

1. **Meus eventos**, incluindo o acesso: ajustar AuthPage sem mudar serviços; exibir capa, data, status e resumo por evento. Estados carregando/erro não se confundem com lista vazia.
2. **Evento**: cabeçalho contextual, navegação com ordem exata e prévia usando `EventInvitation` no formulário. O modo prévia recebe rascunho local, IDs próprios e links/ações inertes identificados, sem formulário de envio nem listeners. Não alterar a semântica atual de salvar rascunho/publicar, inclusive a mudança de status realizada pelo serviço.
3. **Convidados**: busca e filtro somente na projeção exibida, mantendo roster integral para associações, mesclagem e totais. Busca por nome normalizado usa helper existente; limpar filtros restaura lista. Operações destrutivas mantêm confirmação e bloqueios. Inativos ficam separados; recados privados acessíveis no contexto.
4. **Compartilhar**: reorganizar SharePanel e reutilizar cópia de link com erro/alternativa, mantendo WhatsApp/e-mail e QR. Mostrar falha de geração do QR e orientar a usar link ou tentar novamente; não silenciar falha.
5. **Mensagens**: melhorar leitura, autoria, data e estados dos recados recebidos. Sem modelos, lembretes ou campos novos.
6. **Exportar**: transformar a ação de navegação em seção local `export`, com prévia e botão CSV existente; preservar nome de arquivo, cabeçalho, BOM, escaping e ordem das colunas. Nenhuma nova rota.

Cabeçalho/totais devem funcionar antes de visitar Convidados e ao abrir Exportar diretamente. Reutilizar `listenToEventManagement` e `reconcileEventInbox`, com prontidão de snapshots e encerramento de listeners; não executar reconciliação com dados do evento anterior. Na lista, resumos precisam do estado carregado de cada evento; usar o mesmo ciclo existente para sincronização, sem novo formato de resumo no banco. Não criar listeners para a mesma entidade em cada componente consumidor.

Contagens e prévia usam `topLevelGuests`, `companionsForGuest`, `confirmedParticipants` e `participantsForGuest`. Se necessário, extrair um único helper puro de totais em `participantList.js`, preservando a semântica existente de recusados; não substituir dados completos pelos resultados de busca.

### Validação e rastreabilidade

| Entrega | Requisitos | Verificação prevista |
|---------|------------|---------------------|
| Tokens, fontes, ritmo e contraste | FR-004–007, 026–029 | Cálculo de pares, estilos computados, teclado, zoom, movimento reduzido e falha de fontes |
| Convite e CTA | FR-001, 008–009, 016 | E2E nas três larguras; mapa, capa/alternativa, foco e ausência de acesso privado |
| Responder, sucesso e editar | FR-010–015 | Unitários dos campos/cópia/formatação; E2E criar/editar/recusar, erro e link revogado |
| Gate público | FR-030, SC-008 | Demonstração e aprovação humana explícita; bloqueio de tarefas administrativas |
| Acesso, lista e evento | FR-017–019, 031 | E2E autenticação existente, resumo carregado, navegação, preview sem escrita |
| Gestão de convidados | FR-002, 011, 020 | Regressão importação, telefone, associação, inativos, mesclagem; busca/filtro sem alterar totais |
| Compartilhar e mensagens | FR-021–023, 025 | Cópia com falha, QR com falha, links corretos, recados privados e vazios |
| Exportar | FR-024 | Prévia = linhas da projeção e conteúdo CSV real após troca de evento |
| Preservação e limites | FR-002–003, 032 | Unitários/regras/E2E existentes, ausência de migração/novos campos ou serviços |

Adaptar seletores E2E aos novos textos acessíveis de forma coordenada, sem remover verificações para fazer testes passarem. Não adicionar axe/Lighthouse como dependências obrigatórias: combinar testes de DOM, teclado e medidas Playwright com revisão manual; não alegar conformidade completa só por testes de cores.

As sessões com cinco pessoas, duas com 60+, e a aprovação são validações manuais pendentes. Medir desempenho com build de produção, não servidor de desenvolvimento, conforme [quickstart.md](./quickstart.md).

### Arquivos fora da alteração planejada

Não modificar `database.rules.json`, paths Firebase, autenticação, importador, algoritmos de associação/mesclagem, serviços de escrita de RSVP/evento ou formato do CSV. Qualquer falha de regressão ligada a um desses contratos exige investigar e preservar o comportamento, não redesenhar regras.

## Complexity Tracking

Sem exceções constitucionais ou complexidade adicional que precise de justificativa. Os únicos componentes novos correspondem a duplicações concretas: convite/prévia, campos criar/editar, cópia de links e prévia de exportação.
