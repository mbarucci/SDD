# Contrato de Acesso: Firebase Realtime Database

Este contrato especifica fronteiras de autorização para o SDK Web. Não define uma API HTTP própria. A escrita anônima de RSVP permanece bloqueada para produção até que as Security Rules e o matching privado passem os testes no Emulator Suite.

## Papéis

| Ator | Identidade | Acesso permitido |
| --- | --- | --- |
| Anfitrião | `auth.uid` do Firebase Authentication | Ler e gerir eventos cujo `ownerUid` persistido corresponda ao UID autenticado. |
| Convidado | Não autenticado | Ler somente conteúdo publicado; criar submissão limitada; usar token para ler/editar somente seu próprio RSVP. |
| Visitante não autorizado | Não autenticado ou outro UID | Nunca ler roster, mensagens, respostas de terceiros, `ownerUid` ou capacidades de edição. |

## Operações

### Criar evento

- Requer anfitrião autenticado.
- A gravação associa `ownerUid` a `auth.uid`.
- Falha se `ownerUid` for omitido, diferente do UID autenticado ou posteriormente alterado.
- A publicação do conteúdo não concede leitura da árvore privada.

### Consultar evento público

- Permitir leitura apenas do conteúdo publicado em `publicEvents/{eventId}`.
- Negar leitura no ancestral que contenha dados públicos e privados misturados.
- Não retornar a lista privada para procurar correspondência de nome.
- URLs de imagem HTTPS são fornecidas pelo anfitrião e carregadas diretamente pelo navegador; não há proxy, geocodificação ou serviço de imagem adicional.

### Gerir evento

- Exigir `auth != null` e igualdade entre `auth.uid` e o proprietário persistido.
- Aplicar a mesma checagem para leitura e escrita de convidados, respostas, mensagens e exportação.
- Negar acesso de outro anfitrião mesmo que conheça `eventId`.

### Submeter RSVP à inbox privada

- Visitante não autenticado pode criar somente uma submissão nova em `privateEvents/{eventId}/inbox/{submissionId}`.
- Validar evento publicado, estado enumerado, campos obrigatórios, tipos, comprimentos máximos e ausência de propriedades inesperadas.
- Limitar mensagens a 500 caracteres; uma mensagem deve acompanhar uma decisão válida, inclusive quando enviada por edição sem alterar a decisão existente.
- Negar listagem/leitura pública da inbox, roster e mensagens; somente o UID proprietário lê e associa submissões.
- Impedir que a submissão altere `ownerUid`, dados do evento, outras respostas ou registros privados.
- Não assumir que essas validações impedem spam, abuso de cota ou RSVP por outra pessoa. RTDB Rules não oferecem rate limiting confiável por IP/identidade anônima.
- O cliente do anfitrião normaliza nomes ignorando caixa, espaços externos/repetidos e equivalência Unicode canônica, preservando acentos e pontuação; associa correspondência única e marca duplicatas/não correspondências para revisão, sem disponibilizar roster ao convidado.
- Inbox retém submissões não associadas até associação/exclusão manual; não há expiração nem tarefa de limpeza.
- Se o anfitrião estiver desconectado, a submissão aguarda na inbox e aparece na próxima abertura; o limite de cinco segundos vale somente quando o anfitrião está conectado com a gestão aberta.

### Editar RSVP

- Usar capacidade aleatória de alta entropia, exclusiva da resposta, nunca nome ou ID sequencial.
- A capacidade permite ler/editar somente a resposta correspondente; não pode listar inbox/roster, mensagens privadas ou outras respostas.
- Tokens não expiram automaticamente. O anfitrião pode revogar o token e emitir outro, invalidando o anterior; o convidado solicita novo link ao anfitrião, sem reenvio automatizado.
- Edições concorrentes pela mesma capacidade atualizam o mesmo registro e a última gravação aceita prevalece.
- Tratar a URL como segredo bearer: analytics, logs, referrer e compartilhamento do link podem expor acesso.
- Cobrir leitura/gravação da resposta específica com testes no emulador antes de aprovar.

## Invariantes de Security Rules

1. Negar por padrão; nenhuma permissão ampla no root ou em ancestral misto.
2. Proprietário comparado com dado já persistido; o cliente não escolhe nem altera a propriedade.
3. Dados privados legíveis somente pelo dono autenticado, exceto capacidade individual explicitamente aprovada.
4. Validar esquema, limites e enumerações em Rules; rejeitar campos adicionais e exclusões que ignorem validação. Excluir submissão sem correspondência é uma ação autenticada do proprietário.
5. Regras são testadas com usuário proprietário, outro usuário autenticado e usuário anônimo no Firebase Emulator Suite.
6. App Check pode ser avaliado como redução adicional de abuso, mas não é identidade nem garantia contra abuso e não substitui Rules.

## Critério de liberação

Nenhuma gravação anônima vai para produção até que os testes provem isolamento entre eventos, ausência de leitura da lista/inbox/mensagens por convidados, escopo de edição e revogação de tokens, validação dos limites e impossibilidade de alterar resposta de terceiros sem capacidade válida. Testes das Rules são condição obrigatória de liberação.
