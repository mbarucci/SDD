# Pesquisa Técnica: RSVP de Festa

**Data da pesquisa**: 2026-10-05

## Decisões e recomendações

### Autenticação do anfitrião

**Decisão aprovada**: Firebase Authentication com e-mail/senha somente para o anfitrião; convidados não se autenticam. O UID autenticado é a identidade proprietária do evento. Não usar SMS nem serviços que exijam billing para o fluxo definido.

**Alternativas**: login Google também é opção, com configuração e políticas do provedor externo; link por e-mail está sujeito ao limite Spark de cinco e-mails de autenticação por dia/projeto. Evitar SMS.

Fontes oficiais: [planos e faturamento Firebase](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans), [Firebase Authentication](https://firebase.google.com/docs/auth), [limites do Authentication](https://firebase.google.com/docs/auth/limits), [autenticação por senha na Web](https://firebase.google.com/docs/auth/web/password-auth).

### Realtime Database e regras

**Decisão**: usar Firebase Realtime Database e SDK Web direto, sem Cloud Functions, de acordo com as restrições atuais. Permissões de anfitrião devem depender de `auth.uid` e do UID proprietário armazenado; dados privados não podem ficar sob um ancestral com leitura pública. A autorização deve ser verificada com Firebase Local Emulator Suite antes de qualquer lançamento.

**Limites Spark**: 100 conexões simultâneas por instância, 1 GB armazenado e 10 GB de downloads mensais. Uma conexão pode corresponder a uma aba ou dispositivo; é limite de simultaneidade, não de convidados totais. A instância e o limite são compartilhados entre eventos. Downloads e solicitações negadas também consomem transferência; exceder cotas Spark pode interromper o serviço. A aplicação precisa tratar indisponibilidade e não assumir que 100 convidados mais o anfitrião cabem no limite.

**Regras**: não conceder `.read`/`.write` no caminho ancestral público; permissões concedidas em ancestrais se propagam aos descendentes. Validar tipo, tamanho, enumeração, campos imutáveis e formato; negar propriedades extras e exclusões indevidas. Regras não substituem rate limiting nem verificam a identidade de um convidado anônimo.

**Decisão aprovada para preservar privacidade sem API própria**: gravar submissões anônimas numa inbox sem leitura pública. Somente o UID proprietário pode ler a inbox e o roster privado; o cliente autenticado do anfitrião compara nomes e associa correspondências únicas, deixando duplicatas para revisão. Se a gestão estiver fechada, a associação aguarda o anfitrião reabrir a área. Security Rules não limitam taxa por IP, e a submissão por nome não comprova identidade. O link de edição é uma credencial bearer revogável, sem expiração automática; qualquer pessoa que obtiver o link poderá editar somente aquela resposta até a revogação.

Fontes: [limites do RTDB](https://firebase.google.com/docs/database/usage/limits), [uso e faturamento do RTDB](https://firebase.google.com/docs/database/usage/billing), [condições de Security Rules](https://firebase.google.com/docs/database/security/rules-conditions), [sintaxe e cascata de regras](https://firebase.google.com/docs/database/security/core-syntax), [testes de regras](https://firebase.google.com/docs/rules/unit-tests).

### Localização

**Decisão**: apresentar endereço e imagem estática do local por URL pública; oferecer link de direções via Google Maps URLs. Não incorporar mapa interativo nem usar Maps Embed, Maps JavaScript ou Static Maps API. Google Maps URLs não exigem API key; portanto, esse fluxo não exige vincular faturamento para API de mapas.

A imagem do local é um asset externo fornecido pelo anfitrião e segue a mesma decisão pendente de hospedagem das fotos da galeria. Se a URL falhar, manter endereço e link de direções.

Fonte: [Google Maps URLs](https://developers.google.com/maps/documentation/urls/guide).

### QR Code e compartilhamento

O QR Code deve codificar o link público canônico do evento e ser gerado no navegador. `qrcode` é candidato para gerar canvas/PNG, mas versão e dependências precisam ser fixadas e revisadas na implementação. Testar leitura em dispositivos reais.

WhatsApp pode ser aberto com `https://wa.me/?text=` e texto codificado; o usuário revisa e envia, sem confirmação de entrega. `mailto:` prepara rascunho no cliente do usuário, não envia mensagem por si só. Manter copiar link e QR como alternativas quando o canal não estiver disponível.

Fontes: [biblioteca QR candidata](https://github.com/soldair/node-qrcode), [WhatsApp FAQ](https://faq.whatsapp.com/425247423114725), [RFC 6068 `mailto`](https://www.rfc-editor.org/rfc/rfc6068), [Web Share API](https://www.w3.org/TR/web-share/).

### Imagens externas

**Decisão aprovada**: persistir somente URLs públicas HTTPS, texto alternativo/legenda e ordem; o anfitrião fornece URLs da galeria e da foto opcional do espaço. Nenhum provedor é escolhido nesta fase. Disponibilidade, hotlinking, expiração e custo dependem do provedor futuro. A página informa que o provedor externo pode receber IP e metadados de carregamento; não haverá proxy nem bloqueio adicional do carregamento.

Validar URL e hostname contra uma allow-list que será definida junto com o provedor; usar CSP `img-src` compatível, `<img>` com `alt`, dimensões estáveis, lazy loading e fallback. URLs externas informam ao host da imagem o IP do visitante. `referrerpolicy="no-referrer"` reduz envio do endereço da página, mas não oculta o IP e pode afetar hosts com anti-hotlink.

Fontes: [CSP `img-src`](https://www.w3.org/TR/CSP3/#directive-img-src), [elemento HTML `img`](https://html.spec.whatwg.org/multipage/embedded-content.html#the-img-element), [Referrer Policy](https://w3c.github.io/webappsec-referrer-policy/).

## Pendências antes do lançamento

- Validar o fluxo de inbox privada no Emulator Suite e confirmar que associação feita no cliente do anfitrião atende ao prazo de UX.
- Confirmar limite de conexões simultâneas e comportamento ao atingir a cota Spark.
- Confirmar hosting e provedores externos de imagem sem adotar serviço pago para os limites pretendidos; a escolha não bloqueia o desenvolvimento local.
- Validar domínio, redirects de Authentication, cache e transferência do hosting no Spark.
- Validar limites reais de conexão e transferência no Spark; o emulador não simula essas cotas de produção.
- Revisar exposição de tokens bearer em URLs, analytics, logs e referrer antes do lançamento.

## Pesquisa complementar: operações do roster de convidados

### Exclusão, inativação e limite de registros

**Decisão**: limitar a 100 os convidados ativos do roster. Ao excluir um convidado principal, remover seu RSVP associado e a respectiva capacidade de edição após confirmação; mover seus cadastros de acompanhantes vinculados para uma coleção privada de inativos, mantendo-os fora das listas, totais e limite de ativos. Permitir exclusão individual dos registros inativos. Um convidado inativo que for recadastrado recebe um novo cadastro ativo, sem reativação implícita do histórico.

**Racional**: o usuário definiu que inativos não devem ocupar vagas, mas precisam permanecer identificáveis e removíveis individualmente. Separar `inactiveGuests` do roster ativo preserva o teto e slots existentes `guest-001` a `guest-100` sem sobrescrever registros arquivados.

**Alternativas consideradas**: manter inativos nos mesmos slots (reduz vagas disponíveis, contrário à decisão); sobrescrever inativos automaticamente ao cadastrar (apaga histórico sem exclusão explícita); expandir sem limite os slots ativos (enfraquece o limite de 100 e altera as Rules de criação).

### Edição e mesclagem de convidados

**Decisão**: editar somente nome e telefone do cadastro, sem modificar RSVP ou acompanhantes. Mesclar somente convidados principais; selecionar o registro destino e executar a transferência do RSVP associado e de seus acompanhantes na mesma gravação atômica multipath do Realtime Database. Bloquear antes de gravar se ambos tiverem respostas associadas, ou se telefones preenchidos divergirem. O nome do destino prevalece; telefone ausente pode receber o valor da origem.

**Racional**: corresponde às regras funcionais FR-031, FR-034 e FR-035 e usa o padrão administrativo já presente em `guestRepository.js`, que organiza correções de associação com `update()` multipath. A gravação única evita estado parcial entre roster, inbox e capacidade de edição.

**Alternativas consideradas**: permitir mesclar respostas concorrentes (ambiguidade de decisão e link); escolher telefone automaticamente em conflito (perda de informação); sequenciar gravações separadas (falhas podem deixar associação inconsistente).

### Reconciliação de acompanhantes

**Decisão**: combinar listas de acompanhantes ao mesclar convidados, identificando a mesma pessoa pela combinação de nome normalizado e idade. Manter uma ocorrência quando as chaves coincidirem; preservar acompanhantes distintos. Permitir remoção individual de um acompanhante do RSVP/cadastro sem excluir o principal ou os demais acompanhantes. Atualizar os vínculos de cadastros já associados para apontarem ao convidado destino.

**Racional**: a chave de deduplicação segue diretamente a regra aprovada em FR-036. Remoções e reparenting precisam sincronizar o RSVP ativo e os registros vinculados para que listas, totais e CSV não contenham duplicatas nem referências órfãs.

**Alternativas consideradas**: deduplicar somente por nome (pode colapsar homônimos); deduplicar por nome, idade e telefone (acompanhante não tem telefone no RSVP); deixar vínculos antigos no cadastro de origem excluído (gera registros órfãos).

### Segurança e interface

**Decisão**: manter operações restritas ao anfitrião proprietário por `auth.uid`; validar novos estados e campos em Security Rules; permitir remoção de RSVP/capacidade e operações multipath somente em contexto autenticado do proprietário. Confirmar exclusões destrutivas na UI e apresentar conflitos impeditivos antes da escrita. Expor inativos somente na área privada do anfitrião.

**Racional**: a regra mantém o modelo sem backend próprio nem novos serviços pagos e preserva a separação público/privado existente. Os testes de Rules verificam o limite de autorização; os testes de integração e E2E verificam atomicidade observável e confirmação.

**Alternativas consideradas**: expor operações ao convidado por token (ultrapassa o escopo administrativo); acrescentar Cloud Functions (nova dependência operacional e potencial custo); permitir leitura pública de inativos (viola privacidade do roster).
