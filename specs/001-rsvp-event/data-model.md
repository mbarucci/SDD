# Modelo de Dados: RSVP de Festa

Este modelo é uma proposta para Firebase Realtime Database. Os caminhos exatos e as gravações públicas não estão liberados para implementação até que os gates de associação privada de convidados e segurança sejam resolvidos.

## Entidades

### Conta do anfitrião

- `uid`: ID estável do Firebase Authentication.
- `email`: endereço de autenticação, acessível somente conforme as regras de Authentication.
- Relação: um anfitrião pode possuir vários eventos; evento não pode ser transferido por alteração de dados enviada pelo cliente.

### Evento

- `eventId`: identificador aleatório não sequencial usado no link público.
- `ownerUid`: UID imutável do anfitrião proprietário.
- `status`: rascunho ou publicado.
- `title`, `date`, `time`, `location`, `description`, `supportingText`: conteúdo validado do evento.
- Relações: uma galeria de referências de fotos, lista privada de convidados, respostas e mensagens.

### Foto

- `url`: URL pública HTTPS; hostname permitido ainda será definido quando o provedor for escolhido.
- `altText`: descrição acessível.
- `caption`: legenda opcional.
- `position`: ordem estável na galeria.

### Localização do evento

- `address`: endereço informado pelo anfitrião.
- `imageUrl`: URL pública opcional da imagem estática do local.
- `imageAltText`: texto alternativo da foto opcional do espaço.
- `directionsUrl`: Google Maps URL construída a partir do endereço; não usa Maps API.

### Convidado cadastrado

- `guestId`: ID aleatório estável.
- `name`: nome cadastrado pelo anfitrião.
- `phone`: telefone privado opcional de até 40 caracteres, armazenado como texto; aceita dígitos, espaços, `+`, `(`, `)`, `.` e `-`. Pode ser editado ou removido sem alterar o RSVP; ausente nos cadastros antigos.
- `associationSource`: `automatic` ou `manual`, opcional para compatibilidade com cadastros existentes. Uma associação manual não pode ser substituída por uma nova correspondência automática de outra resposta; o campo é removido ao devolver o cadastro a pendente.
- `normalizedName`: chave derivada de forma Unicode canônica, caixa ignorada e espaços externos/repetidos removidos; acentos e pontuação são preservados.
- `status`: `pending`, `confirmed` ou `declined`.
- `companions`: lista privada opcional de até 20 acompanhantes do RSVP confirmado; cada item contém nome (até 100 caracteres) e idade inteira entre 0 e 120. Cada acompanhante conta como participante confirmado adicional.
- Relação: uma resposta associada; nomes duplicados exigem resolução pelo anfitrião.

Importações criam somente entidades de convidado cadastrado, sem persistir o arquivo ou a prévia. A chave de deduplicação combina o nome normalizado e os dígitos do telefone; ausência de telefone equivale a uma string vazia. O roster é gravado por transação para preservar alterações concorrentes e verificar as vagas disponíveis, mantendo os slots `guest-001` a `guest-100`. Cada registro novo recebe ID próprio, estado pendente e data de criação.

### Submissão RSVP

- `submissionId`: ID aleatório da submissão.
- `submittedName`: texto não confiável informado pelo visitante.
- `decision`: `confirmed` ou `declined`.
- `message`: texto opcional de até 500 caracteres, enviado junto da resposta e sempre tratado como texto.
- `companions`: lista opcional, permitida somente quando `decision` é `confirmed`, com até 20 itens `{ name, age }`; permanece vinculada a esta submissão e à sua capacidade de edição.
- `createdAt`: timestamp validado na criação.
- `guestId`: preenchido pelo cliente autenticado do anfitrião somente depois de associação autorizada; duplicatas aguardam resolução manual.
- `reviewRequired`: ao desfazer uma associação, permanece `true` na capacidade de edição, sem `guestId` nem `previousGuestId`, para impedir nova associação automática. Somente o anfitrião pode liberar essa revisão associando a resposta novamente. O convidado pode continuar editando nome, decisão, mensagem e acompanhantes, mas não pode remover a revisão.
- `status`: `unmatched`, `matched` ou `duplicate-review` até associação pelo anfitrião.
- Relação: submissões não associadas ficam na inbox privada, gravável por convidado anônimo e legível somente pelo proprietário autenticado; a fila não expira automaticamente. Após associação, o mesmo registro permanece como RSVP privado, fora da fila pendente.

### Capacidade de edição

- `token`: segredo aleatório de alta entropia, usado como capacidade bearer para uma única resposta.
- `submissionId`: resposta que essa capacidade autoriza editar.
- `companions`: acompanhantes da resposta, atualizados pelo mesmo token e removidos quando a resposta é recusada ou a lista é esvaziada.
- `revokedAt`: timestamp opcional de revogação pelo anfitrião; tokens não expiram automaticamente.
- Rotação: emitir novo token revoga o anterior; não há reenvio automatizado.
- Qualquer pessoa que obtenha o token poderá agir como o convidado daquela resposta; o token não comprova identidade.

## Estado e transições

- Convidado cadastrado começa `pending`.
- Uma resposta comprovadamente associada muda para `confirmed` ou `declined`.
- Nome inexistente ou duplicado não deve alterar o estado de um convidado antes da resolução pelo anfitrião; envios não associados ficam na inbox até ação manual, sem expiração automática.
- Ao associar uma submissão, o anfitrião altera o estado do mesmo registro e o RSVP continua privado; não é necessária cópia para outro caminho.
- Uma edição com capacidade válida atualiza a resposta existente, não cria duplicata.
- Acompanhantes são associados ao RSVP principal, copiados para o registro privado do convidado após associação e removidos da projeção quando a resposta deixa de ser confirmada.
- Renomear uma resposta coloca a associação em revisão; nenhum convidado muda de estado até o anfitrião resolver a nova associação.
- Reenvios pelo formulário público recebem IDs independentes; depois de associados, a submissão aceita mais recentemente define o estado do convidado. Edições pelo mesmo token atualizam um registro e a última gravação aceita prevalece.

## Separação proposta no RTDB

```text
publicEvents/{eventId}
  status
  title
  date
  time
  location
  locationImageUrl
  locationImageAltText
  description
  supportingText
  photos/{photoId}

privateEvents/{eventId}
  ownerUid
  guests/{guestId}
    companions/{index} -> name, age
  inbox/{submissionId}
    companions/{index} -> name, age

publicEditCapabilities/{token}
  eventId
  submissionId
  companions/{index} -> name, age
  revokedAt
```

Os caminhos públicos de evento não podem conter lista de convidados, mensagens, capacidades de edição ou UID proprietário. Convidados leem somente o evento publicado e podem criar novos itens na inbox; não podem ler inbox, roster, mensagens ou outras respostas. Inbox e roster são legíveis somente pelo proprietário autenticado. Capacidades de edição não expiradas automaticamente e não revogadas permitem acesso somente ao RSVP correspondente, sem revelar a árvore privada. O contrato em [contracts/realtime-database.md](contracts/realtime-database.md) define os invariantes propostos.

## Limite conhecido

O cliente do convidado não baixa `privateEvents/{eventId}/guests`. A normalização e o matching ocorrem no cliente autenticado do anfitrião, que lê a inbox e o roster somente com a gestão aberta. O SLA de cinco segundos vale apenas com conexão ativa e gestão aberta; quando o anfitrião está offline, a submissão permanece na inbox até a próxima abertura. Escritas anônimas ainda permitem impersonação e abuso de quota.
