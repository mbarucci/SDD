# Modelo de dados e estado de apresentação

**Escopo**: [spec.md](./spec.md), FR-002–003, 011–016, 017–024. Não há migração, campos novos no banco ou alteração de Rules. O [modelo existente](../001-rsvp-event/data-model.md) continua canônico.

## Entidades persistidas reutilizadas

| Entidade | Dados utilizados | Relações e invariantes |
|----------|------------------|------------------------|
| Evento público | `id` em memória, `title`, `date`, `time`, `location`, `description`, `supportingText`, `locationImageUrl`, `locationImageAltText`, `photos`, `status` | `ownerUid` não é apresentação pública. Rascunho só no contexto privado autorizado; visitante lê evento publicado |
| Convidado ativo | `guestId`, `slot` em memória, `name`, `normalizedName`, `phone`, `status`, `submissionId`, `updatedAt` e campos de vínculo existentes | Até 100 slots ativos; telefone privado; filtros não alteram identidade/slot |
| Acompanhante | `name`, `age` na resposta; possível cadastro espelho com `guestRole`, `companionOfGuestId`, `companionOfSubmissionId`, `companionAge` | Nome/idade preservados; até 20 por resposta; vínculo herda decisão. Não criar contadores editáveis |
| Inativo | Coleção privada existente com `guestId`, nome, telefone opcional, `status: inactive`, `inactiveAt` | Exibido em seção separada; fora de totais ativos/exportação e do limite ativo |
| RSVP/capacidade | `eventId`, `submissionId`, `name`, `decision`, `message`, `companions`, `createdAt`, `updatedAt`, `status` de associação e campos de revisão/revogação existentes | `decision` somente `confirmed` ou `declined`; status de associação não é decisão de presença |
| Inbox | Registros existentes que apontam para capacidade por `token` | Gestão privada observa a capacidade atual; não produzir nova fonte de verdade |
| Mensagem recebida | `message`, nome do remetente e timestamp da resposta | Projeção privada da resposta, não entidade de envio |

Ausência de campo opcional em registros antigos não exige atualização retroativa. Não derivar anfitrião de e-mail privado nem criar um campo para nome do anfitrião.

## Identidade visual

Tokens de apresentação em CSS: superfícies, texto, destaque, status, foco, fontes, raios, sombra, espaçamento e movimento. Não são campos de evento. Terracota padrão para todos os eventos nesta etapa; composição com a capa mantém identidade sem extração automática.

Fontes locais são assets estáticos licenciados; não guardar preferências tipográficas ou cores de evento no Firebase.

## Projeções derivadas

### Convite

- Recebe evento público ou rascunho privado fornecido pelo editor.
- `cover`: imagem HTTPS do local; se ausente, primeira foto existente; se inválida/indisponível, composição alternativa.
- Datas `YYYY-MM-DD` formatadas por partes ou como data local sem conversão implícita para UTC que mude o dia. Horário existente sem fuso inventado.
- Saudação padrão “Você está convidado”. Não ler cadastros privados.
- Preview usa namespace de IDs diferente e não cria links operáveis de publicação/resposta.

### Participantes e totais

- Principais: `topLevelGuests(roster)`; pendentes contados somente entre principais ativos.
- Confirmados: `confirmedParticipants(roster)`, incluindo acompanhantes uma única vez.
- Recusados: preservar a semântica atual dos cadastros com `status: declined`, com rótulo claro; não inventar quantidade de acompanhantes sem registro.
- Vínculos/duplicatas: usar `companionsForGuest` e chave já existente de nome normalizado + idade.
- Totais de cabeçalho/lista/exportação dependem de estado carregado e sincronizado do mesmo evento. Não usar resultados filtrados como denominador.
- Preview CSV: mesmas linhas de `confirmedParticipants`; telefone só do principal, acompanhante identificado pela coluna de vínculo.

### Busca e filtro

Estado local `query` e `statusFilter`. Comparar nomes pelo `normalizeName` existente; não introduzir normalização distinta que altere regras de associação. Os filtros só afetam a exibição; “Nenhum resultado” oferece limpar filtros, enquanto lista vazia oferece adicionar/importar.

## Estados transitórios da interface

| Superfície | Estados | Transições esperadas |
|------------|---------|---------------------|
| Convite | carregando, disponível, indisponível, erro de carga | Carga autorizada → conteúdo; falha → orientação de recuperação, sem dados privados |
| CTA móvel | visível, oculta | Ocultar quando formulário/resultado está visível ou focado; sem observador, ação normal no fluxo |
| Novo RSVP | rascunho, salvando, erro, sucesso | Selecionar não grava; confirmar chama serviço existente; erro preserva dados; sucesso destaca edição |
| Editar RSVP | carregando, indisponível, rascunho preenchido, salvando, erro, salvo | Salvar atualiza a capacidade existente; não cria outro submissionId; resumo exibe versão salva |
| Cópia | pronta, copiando, copiada, erro | Sucesso só após clipboard resolver; erro mantém URL selecionável e instrução manual |
| Gestão por evento | carregando, pronta, erro | Troca de evento descarta projeção anterior; não exibir zero nem habilitar exportação com dados não carregados |
| Prévia de evento | rascunho local | Digitar atualiza somente props; salvar/publicar continua explícito pelo serviço existente |
| Exportação | carregando, vazia, pronta, erro | Prévia e download habilitados somente para o evento correto carregado |

Não persistir `query`, `statusFilter`, `selectedPanel`, estado da cópia, visibilidade de CTA ou prévia. Não introduzir autosave, expiração ou cache de tokens compartilhado com o convite.

## Regras de validação preservadas

- Nome do convidado e acompanhante com limites atuais; idade inteira de 0 a 120; no máximo 20 acompanhantes.
- Mensagem até 500 caracteres; telefone opcional privado com validação existente.
- Somente `confirmed`/`declined` em payloads; ausência de `maybe`, restrições alimentares, itens para levar, quantidades de adultos/crianças ou campos de tema.
- Exclusão, inativação e mesclagem preservam contratos atômicos existentes.
- CSV mantém `Nome,Idade,Telefone,Convidado principal,Situação,Data da última resposta`, BOM e escaping.

## Compatibilidade e recuperação

O redesign deve abrir links `/event/{eventId}` e `/edit/{token}` antigos. Rótulos podem mudar sem alterar valores persistidos. Timestamp ausente não recebe substituição por data atual. Erros de carga não significam ausência de pessoas; erros de salvamento não significam sucesso.
