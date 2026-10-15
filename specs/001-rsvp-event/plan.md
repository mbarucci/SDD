# Plano de Implementação: RSVP de Festa

**Branch**: `main` (checkout atual; feature `001-rsvp-event`) | **Data**: 2026-10-15 | **Spec**: [spec.md](spec.md)

**Status**: Plano de design para gestão avançada de convidados concluído; implementar após geração/ordenação das tarefas e validar Rules no Emulator Suite.

## Resumo

Estender a área autenticada de convidados para editar cadastro (nome/telefone), excluir convidados com RSVP/link associado mediante confirmação, inativar e remover acompanhantes cadastrados individualmente, e mesclar dois convidados principais com RSVP e acompanhantes. Preservar Firebase Authentication e Realtime Database existentes; autorizar as operações pelo UID proprietário e executar mudanças relacionadas em gravações multipath atômicas. O roster terá até 100 convidados ativos; acompanhantes inativos ficam em coleção privada separada e não consomem vagas. Mesclagens bloqueiam conflitos de resposta/telefone, deduplicam acompanhantes por nome normalizado e idade e mantêm acompanhantes distintos.

## Contexto Técnico

**Linguagem/Versão**: JavaScript moderno (ES modules); Node.js 24 LTS, declarado em `.nvmrc` e `package.json`.

**Dependências principais**: React 19, Vite 7, Tailwind CSS 4, Firebase Web SDK 12; reutilizar os componentes e serviços existentes, sem dependência nova.

**Armazenamento**: Firebase Realtime Database no plano Spark; roster ativo sob `privateEvents/{eventId}/guests`, histórico inativo sob `privateEvents/{eventId}/inactiveGuests`, submissões em `inbox` e capacidades individuais em `publicEditCapabilities`.

**Testes**: Vitest unitário, Firebase Local Emulator Suite para Security Rules, Playwright para fluxos no navegador, `npm run build`.

**Plataforma-alvo**: Navegadores móveis e desktop; aplicação estática existente em Firebase Hosting.

**Tipo de projeto**: Aplicação web client-side em React/Vite, sem backend/API própria.

**Metas de desempenho**: Operações de mesclagem/exclusão para até 100 convidados ativos devem completar como uma única atualização atômica; manter o limite de atualização da gestão em até cinco segundos. Nenhum polling ou serviço de processamento em segundo plano será adicionado.

**Restrições**: Só o anfitrião se autentica; cada mutação administrativa requer proprietário do evento. Sem Cloud Functions, API própria, polling adicional, billing ou dependências novas. Dados inativos continuam privados até exclusão individual, mas não contam para o limite de convidados ativos; re-convidar uma pessoa cria um cadastro ativo novo.

**Escala/Escopo**: Até 100 convidados ativos por evento; quantidade de registros inativos sem limite funcional definido, sujeita às cotas Firebase. Mesclagem somente de convidados principais; no máximo um RSVP associado entre os cadastros fonte/destino. Até 20 acompanhantes por RSVP conforme o comportamento existente.

## Verificação da Constituição

| Gate | Estado | Evidência |
| --- | --- | --- |
| Especificação antes da implementação | PASS | [spec.md](spec.md) define FR-031 a FR-036 e clarificações de exclusão, mesclagem e acompanhantes. |
| Rastreabilidade | PASS | Decisões deste plano referenciam FR-026, FR-029 e FR-031 a FR-036; modelo, Rules e quickstart mapeiam operações e estados. |
| Resultados verificáveis | PASS | [quickstart.md](quickstart.md) define verificações unitárias, Rules e E2E para operações seguras. |
| Mudanças pequenas e reversíveis | PASS | Reutilizar cliente e repositório existentes; uma chamada multipath dá atomicidade sem backend/dependências novas. |
| Segurança e privacidade por padrão | PASS (gate de implementação) | Operações restritas ao dono; exclusão também revoga inbox/capacidade; inativos permanecem privados. Rules e testes de integração devem validar cada remoção/mutação. |
| Compatibilidade com custo pretendido | PASS | Reutiliza Firebase existente, sem APIs pagas, Cloud Functions ou novos serviços. |

**Gate para implementação**: provar no Emulator Suite que somente o proprietário pode editar, mesclar, inativar ou excluir convidados, inbox e capacidades; verificar atomicidade e negação a outro UID/anônimo. Bloquear conflitos antes de qualquer gravação. A coleção inativa continua privada.

## Estrutura do Projeto

### Documentação desta feature

```text
specs/001-rsvp-event/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── realtime-database.md
```

### Código-fonte

```text
src/
├── app/
├── components/
├── features/
│   ├── auth/
│   ├── event/
│   ├── guests/
│   ├── rsvp/
│   └── sharing/
├── services/
│   └── firebase/
└── utils/
tests/
├── unit/
├── rules/
└── e2e/
```

**Decisão de estrutura**: estender a aplicação React/Vite existente. A UI permanece em `src/features/guests/HostDashboard.jsx` e componentes pequenos de edição/mesclagem; a lógica de transição fica em `src/features/guests/guestRepository.js`; validações de projeção em `participantList.js`; Rules em `database.rules.json`. Testes em `tests/unit`, `tests/rules` e `tests/e2e`.

## Decisões Técnicas

### Submissões anônimas

Separar `publicEvents` do caminho privado `privateEvents`. Convidados leem somente conteúdo publicado e podem criar um novo registro em `privateEvents/{eventId}/inbox/{submissionId}` sem ler o ancestral; não podem ler roster, inbox, mensagens privadas ou respostas alheias. Security Rules validam formato, tamanho máximo de 500 caracteres para mensagens, decisão permitida, nome presente, evento publicado e criação somente; leitura da inbox exige UID proprietário. A inbox mantém nome informado, decisão, mensagem opcional, acompanhantes (somente em RSVP confirmado, máximo de 20, cada um com nome e idade inteira entre 0 e 120), data e estado até associação ou exclusão manual, sem expiração automática. Após associação, acompanhantes são projetados no roster privado sob o convidado principal, contam como participantes confirmados individuais e são exportados em linhas próprias; a edição usa o mesmo token do RSVP e recusar presença os remove. O cliente autenticado do anfitrião observa a inbox somente com a gestão aberta e compara nomes com o roster privado: correspondência única associa automaticamente, nomes duplicados aguardam resolução manual e envios sem correspondência podem ser excluídos pelo anfitrião. O prazo de cinco segundos aplica-se após gravação aceita quando o anfitrião está conectado e com a gestão aberta; submissões recebidas offline ficam na inbox e aparecem na próxima abertura, sem SLA durante a desconexão. Como gravações são anônimas, não há limite confiável por pessoa nem moderação automática; permanecem riscos de spam, exaustão de quotas, conteúdo abusivo e RSVP por outra pessoa.

### Edição por link

Usar capacidade aleatória de alta entropia por RSVP como segredo bearer. Cada token autoriza somente leitura e edição da resposta correspondente; não expira automaticamente. O anfitrião pode revogar o token e emitir outro, invalidando o anterior; não há reenvio automatizado, e o convidado solicita novo acesso ao anfitrião. Não permitir token para listar inbox/roster ou ler outros RSVP. Evitar incluir o token em analytics e links de terceiros; validar Rules de leitura, edição e revogação no emulador antes de liberar implementação. Edições concorrentes pela mesma capacidade usam a última gravação aceita.

### Gestão avançada de convidados

Editar cadastro modifica somente nome/normalização e telefone. Excluir principal com RSVP remove seu cadastro, a inbox e capacidade vinculadas após confirmação explícita; a mesma gravação move os registros de acompanhantes previamente cadastrados para `inactiveGuests` com estado `inactive`. A área de inativos oferece exclusão individual, que apaga somente o item escolhido. A coleção ativa mantém os slots `guest-001`–`guest-100`; inativos não consomem vagas nem aparecem em totais/exportações. Um novo cadastro não reativa automaticamente um inativo.

Mesclar principal A em B: verificar antes de escrever se ambos não têm RSVPs concorrentes e seus telefones não conflitam; em conflito abortar sem alterações e orientar resolução manual. B mantém seu nome; se telefone de B está vazio, copia-se A. Se A tem o único RSVP, transferir decisão, mensagem, timestamps, acompanhantes e associação `guestId` nos metadados inbox/capacidade para B; mover/reparentar cadastros espelho e apagar A. Se ambos não têm RSVP, combinar somente cadastros e vínculos de acompanhantes. A lista combinada deduplica por nome normalizado+idade. Uma remoção individual de acompanhante modifica a projeção do RSVP e elimina o espelho da mesma pessoa, sem tocar nos demais.

Todas as mudanças que cruzam roster, inbox, capacidades e arquivo inativo são um único `update()` multipath do Firebase, após leitura privada e validação de pré-condições; erro de autorização, conflito de dados ou falha de rede não pode deixar gravação parcial. Security Rules para remoção da capacidade verificam `eventId` persistido em `data`, já que `newData` não existe ao apagar.

### Mapas

Exibir o endereço e, opcionalmente, uma foto HTTPS externa do espaço, não uma imagem cartográfica. Construir o link de direções codificando o endereço informado em uma Google Maps URL; o anfitrião revisa o destino antes de publicar. Sem API de geocodificação, não validar rota nem endereço por requisição externa; se a rota não for útil, o texto do endereço continua disponível. Não usar Maps Embed, Maps JavaScript ou Static Maps APIs, nem vincular billing. O anfitrião fornece as URLs de imagem; provedor e custos continuam sem escolha.

### Autenticação e hosting

Autenticar apenas anfitrião com e-mail e senha no Firebase Auth; permitir criação de conta, entrada, saída e solicitação de redefinição de senha por e-mail. Não usar SMS sob a restrição de custo. Firebase Hosting é preferência inicial; validar domínio, redirects de Auth, cache de hosting e limites de transferência no Spark antes do deploy.

## Complexidade

Sem backend adicional. A inbox separada evita dar leitura pública à lista e mantém o modelo client-side, mas depende de regras estreitas e teste automatizado. A autenticação do anfitrião não autentica convidados; limites de formato e App Check não eliminam abuso anônimo.

## Pendências de Liberação

1. Testar no Emulator Suite leitura e mutação de `inactiveGuests` por proprietário, outro UID e visitante anônimo, incluindo remoções autorizadas da capacidade pelo `eventId` persistido.
2. Validar com testes unitários pré-condições de mesclagem, transferência do único RSVP e deduplicação de acompanhantes por nome normalizado/idade; falhas impeditivas não podem gravar dados.
3. Validar E2E de edição cadastral sem alteração de RSVP, exclusão/cancelamento, inativação, remoção individual e mesclagem com e sem conflitos.
4. Executar as suítes unitária, Rules e E2E e `npm run build`; confirmar contagem de 100 convidados ativos mesmo com inativos arquivados.

## Artefatos

- Pesquisa e fontes: [research.md](research.md)
- Entidades e caminhos propostos: [data-model.md](data-model.md)
- Invariantes de autorização: [contracts/realtime-database.md](contracts/realtime-database.md)
- Cenários de validação: [quickstart.md](quickstart.md)
