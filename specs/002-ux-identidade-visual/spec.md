# Feature Specification: Usabilidade e identidade visual para eventos de família

**Feature Branch**: `main` (branch atual; nenhuma nova branch criada)

**Created**: 2026-10-15

**Status**: Pronta para planejamento

**Input**: Redesenhar a experiência de eventos familiares com visual caloroso, informal e elegante, inspirado na atmosfera do Partiful e no acabamento tipográfico do Paperless Post, sem reproduzir sua identidade. Priorizar convite público, resposta e edição no celular; depois reorganizar o painel do organizador, preservando navegação, acessos e comportamento existente, salvo extensões expressamente aprovadas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Receber um convite acolhedor e legível (Priority: P1)

Como convidado, inclusive pessoa idosa, quero reconhecer quem me convidou, entender os detalhes da festa e encontrar como responder sem precisar de uma conta.

**Why this priority**: O convite é a entrada principal da aplicação e estabelece a identidade visual e a confiança para responder.

**Independent Test**: Abrir um convite em uma tela de 375px, consultar informações e acessar a resposta por toque e por teclado, sem login.

**Acceptance Scenarios**:

1. **Given** um evento publicado com capa, **When** abro seu link ou QR Code, **Then** vejo capa grande, título com personalidade, anfitrião quando informado, data, hora, descrição, endereço e ação para abrir o mapa.
2. **Given** um convite sem capa ou com imagem indisponível, **When** o consulto, **Then** vejo uma composição alternativa coerente e continuo acessando informações e resposta.
3. **Given** o link público atual, **When** abro o convite, **Then** vejo uma saudação genérica acolhedora, sem nome de convidado nem acesso aos dados de outras pessoas.
4. **Given** a página em uma tela móvel, **When** rolo o conteúdo ou uso zoom, **Then** a ação “Responder ao convite” permanece fácil de encontrar e não cobre conteúdo, campos ou foco.
5. **Given** um convite indisponível, **When** o abro, **Then** recebo orientação humana para conferir o link ou falar com o anfitrião, sem exposição de dados privados.

---

### User Story 2 - Responder e guardar o acesso de edição (Priority: P1)

Como convidado, quero escolher minha resposta com poucos passos, informar acompanhantes e detalhes relevantes e entender como alterá-la depois.

**Why this priority**: A tarefa central deve ser simples, especialmente no celular, sem perder as informações já utilizadas na organização.

**Independent Test**: Enviar uma resposta, guardar o link de edição e reabrir a mesma resposta para modificá-la, sem criar outra.

**Acceptance Scenarios**:

1. **Given** o formulário aberto, **When** escolho uma opção de presença, **Then** a seleção tem texto explícito, indicação não dependente apenas de cor e alvo de pelo menos 48px.
2. **Given** minha opção escolhida, **When** informo meu nome, os acompanhantes por nome/idade quando aplicável e o recado opcional, **Then** a resposta é registrada uma única vez e recebo confirmação calorosa.
3. **Given** uma resposta salva, **When** vejo a confirmação, **Then** encontro o link de edição em destaque, explicação para guardá-lo e ação de copiar; não encontro uma opção “Talvez” nem campos novos.
4. **Given** meu link de edição válido, **When** o abro, **Then** vejo os dados preenchidos e o resumo “Você respondeu: [opção] (em dd/mm)”; ao salvar, altero a mesma resposta.
5. **Given** link inválido ou revogado, **When** tento editar, **Then** não vejo a resposta e sou orientado a pedir um novo link ao anfitrião.
6. **Given** falha de conexão ao salvar, **When** a operação falha, **Then** meus campos permanecem preenchidos e vejo como tentar novamente, sem confirmação falsa.

---

### User Story 3 - Encontrar e configurar meus eventos (Priority: P2)

Como organizador, quero entrar em uma área acolhedora, reconhecer meus eventos e configurar o convite com uma prévia fiel.

**Why this priority**: A organização das informações deve acompanhar a experiência pública aprovada.

**Independent Test**: Entrar, localizar um evento, revisar dados e capa e comparar a prévia com o convite público.

**Acceptance Scenarios**:

1. **Given** que não entrei na conta, **When** abro o acesso administrativo, **Then** encontro entrada, cadastro e recuperação de senha com labels e erros claros, sem novos métodos de autenticação.
2. **Given** minha lista de eventos, **When** a consulto, **Then** cada item mostra capa ou alternativa, nome, data, status e resumo de respostas; sem eventos, encontro “Criar primeiro evento”.
3. **Given** um evento selecionado, **When** navego, **Then** encontro cabeçalho com capa, nome, data e totais de confirmados, recusados e sem resposta e as seções Evento, Convidados, Mensagens, Compartilhar e Exportar confirmados.
4. **Given** a seção Evento, **When** altero os dados do formulário, **Then** a prévia acompanha os valores ainda não salvos e distingue prévia de publicação; salvar e publicar continuam sendo ações explícitas.
5. **Given** o painel em celular, **When** navego entre seções, **Then** todas permanecem alcançáveis e a seção ativa é identificável.

---

### User Story 4 - Gerir convidados sem perder o contexto (Priority: P2)

Como organizador, quero localizar pessoas, entender seus estados e executar as operações administrativas já existentes sem confusão.

**Why this priority**: A lista reúne operações frequentes e destrutivas que exigem clareza e proteção contra erros.

**Independent Test**: Buscar e filtrar convidados, editar um cadastro, importar uma lista e cancelar e confirmar operações destrutivas.

**Acceptance Scenarios**:

1. **Given** uma lista de convidados, **When** busco por nome ou filtro por status, **Then** vejo somente os correspondentes e consigo limpar os filtros; ausência de resultados não é confundida com lista vazia.
2. **Given** um convidado com acompanhantes, **When** consulto seu cadastro, **Then** vejo vínculo, resposta herdada e contagem sem duplicação; inativos continuam separados.
3. **Given** ações de editar, excluir ou mesclar, **When** as utilizo, **Then** as regras aprovadas na feature anterior continuam válidas e as consequências são explicadas antes da confirmação.
4. **Given** recados disponíveis, **When** consulto os detalhes de uma resposta, **Then** posso lê-los somente na área privada.
5. **Given** um RSVP com acesso de edição existente, **When** uso seus controles, **Then** posso continuar revogando e emitindo novo link, claramente identificado como edição da resposta, não como novo convite individual.

---

### User Story 5 - Compartilhar, conversar e exportar com clareza (Priority: P2)

Como organizador, quero compartilhar o convite, consultar recados e revisar os confirmados antes de exportar.

**Why this priority**: Essas tarefas completam o ciclo de organização, depois que convite e convidados estão claros.

**Independent Test**: Copiar o link, visualizar o QR Code, consultar uma mensagem recebida e conferir uma exportação CSV.

**Acceptance Scenarios**:

1. **Given** um evento publicado, **When** abro Compartilhar, **Then** posso copiar o link, visualizar seu QR Code e abrir o compartilhamento no WhatsApp; o compartilhamento por e-mail existente continua acessível.
2. **Given** mensagens recebidas de convidados, **When** abro Mensagens, **Then** vejo autor, conteúdo e contexto da resposta, sem modelos de envio ou disparo de lembretes.
3. **Given** confirmados, **When** abro Exportar confirmados, **Then** vejo prévia coerente com os totais e posso baixar CSV preservando o conteúdo existente, incluindo telefone do principal e identificação dos acompanhantes.
4. **Given** uma seção sem conteúdo, **When** a consulto, **Then** encontro orientação do próximo passo em vez de um espaço vazio.

### Edge Cases

- Nomes, títulos, endereços e mensagens longos não devem sobrepor ações nem causar rolagem horizontal.
- Falha ao carregar capa, fonte ou QR Code deve preservar conteúdo legível e indicar recuperação quando aplicável.
- Sem suporte à cópia automática, oferecer texto selecionável e instrução para copiar manualmente, sem afirmar sucesso.
- Ausência de aplicativo WhatsApp não deve impedir guardar o link de edição ou copiar o convite.
- Cor de destaque de uma capa com baixo contraste precisa ser ajustada ou substituída por uma cor acessível.
- Eventos e respostas antigos devem continuar abrindo, sem exigir preenchimento retroativo dos novos campos.
- Não exibir um nome inventado em “Fulano convidou você” quando o anfitrião não estiver identificado.
- Link público compartilhado não deve revelar uma saudação nominal nem o acesso privado de edição de outra pessoa.
- Alterações no formulário, navegação de volta e falhas de gravação não devem gerar respostas duplicadas ou mudanças não salvas silenciosamente.
- Eventos com 100 cadastros ativos continuam sujeitos ao limite administrativo atual; a interface não deve apresentar isso como “festa lotada” ou impedir uma resposta pública por nova regra.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A navegação do organizador DEVE seguir Acesso → Meus eventos → Evento selecionado → Evento | Convidados | Mensagens | Compartilhar | Exportar confirmados. A navegação pública DEVE seguir Link ou QR Code → Convite público → Responder ao convite → Link para editar a resposta. Preservar os endereços e links existentes.
- **FR-002**: O redesign DEVE preservar autenticação, privacidade, importação, associação automática/manual, edição, exclusão, mesclagem, herança de acompanhantes, inativos, limite de 100 cadastros ativos e exportação já aprovados em [001-rsvp-event](../001-rsvp-event/spec.md), salvo mudanças explicitamente aprovadas nesta feature.
- **FR-003**: O escopo DEVE ser apenas redesign e organização das telas, incluindo busca/filtro da lista existente, prévia visual local, destaque/cópia dos links existentes e prévia da exportação atual. Não criar novos estados de presença, campos persistidos, acessos individuais de convite, calendário, modelos de mensagens ou formatos de exportação.
- **FR-004**: Toda a interface DEVE apresentar clima afetivo, informal e elegante, usando a paleta de lavanda, lilás e azuis pastel fornecida pelo usuário (`#DFC5FF`, `#BCB3E8`, `#D2D6FF`, `#B3C6E8`, `#C5E9FF`), texto escuro com contraste acessível e cores semânticas acompanhadas de texto. Não usar gradientes ou glassmorphism.
- **FR-005**: Títulos DEVEM ter tipografia expressiva e o corpo uma sans legível; a direção de referência é Fraunces e DM Sans, sem Inter, Roboto ou Arial como fontes escolhidas. O corpo DEVE ter ao menos 18px, sem impedir zoom ou preferências do usuário.
- **FR-006**: Cores, tipografia, raios, sombras suaves e espaçamentos DEVEM formar um vocabulário visual único e reutilizado em todas as telas; adotar escala 4/8/16/24/32 e evitar cartões ou ícones decorativos sem função.
- **FR-007**: O evento DEVE ter destaque visual acessível coerente com a identidade compartilhada. Uma variação derivada da imagem existente pode ser apenas de apresentação, com alternativa padrão; não criar campo persistido nem seletor de cor nesta etapa.
- **FR-008**: O convite DEVE priorizar capa, título, identificação do anfitrião somente quando já disponível publicamente, data, hora, local, mapa e descrição. Usar saudação genérica no acesso público; não expor nome ou e-mail da conta administrativa.
- **FR-009**: No convite móvel, a ação “Responder ao convite” DEVE permanecer fixa e visível sem esconder conteúdo nem foco; a ação não deve cobrir o formulário quando ele estiver em uso.
- **FR-010**: A resposta DEVE oferecer apenas “Vou” e “Não posso”, com seleção acessível e alvos de pelo menos 48px. O rótulo principal será “Confirmar presença” para “Vou” e “Confirmar resposta” para “Não posso”, evitando afirmar presença em uma recusa.
- **FR-011**: Acompanhantes DEVEM continuar identificados por nome e idade, preservando validações e limites existentes. Não adicionar contadores preenchíveis de adultos/crianças, nem presumir um limiar etário novo; totais de pessoas devem ser derivados dos registros sem duplicação.
- **FR-012**: O formulário DEVE preservar nome do convidado, decisão, acompanhantes quando aplicável e recado opcional, sem acrescentar restrição alimentar ou “o que posso levar”. Telefone e recados existentes permanecem privados.
- **FR-013**: Após salvar, a confirmação DEVE destacar o link de edição com explicação e ação de copiar; o compartilhamento público deve usar o link do evento, nunca o acesso privado de edição.
- **FR-014**: A confirmação DEVE preservar o contexto do evento e orientar a pessoa a guardar o link de edição; não adicionar integração de calendário nesta etapa.
- **FR-015**: A edição DEVE reaproveitar a experiência de resposta, preenchendo os dados e exibindo opção e data da última resposta, com confirmação explícita de salvamento e tratamento de link inválido/revogado.
- **FR-016**: Estados de disponibilidade DEVEM refletir exclusivamente o comportamento existente: evento publicado ou indisponível e acesso de edição válido ou indisponível/revogado. Não adicionar cancelamento, prazo de expiração, capacidade física ou novos bloqueios de RSVP; não atribuir motivo específico que o sistema não consiga comprovar.
- **FR-017**: Acesso e Meus eventos DEVEM ter estados de carregamento, erro e vazio orientativos. Cada evento deve ter capa/alternativa, nome, data, status e resumo sem expor eventos de outros organizadores.
- **FR-018**: O cabeçalho do evento selecionado DEVE mostrar contexto e totais coerentes com a lista; confirmados incluem acompanhantes uma única vez, e pendentes não incluem inativos nem acompanhantes vinculados.
- **FR-019**: A seção Evento DEVE organizar os campos existentes e oferecer prévia ao vivo claramente identificada, sem publicar automaticamente alterações. A capa usa a imagem do local ou a primeira foto já disponíveis, com alternativa visual quando ausentes; não adicionar upload, novo campo de capa ou seletor persistido de destaque.
- **FR-020**: Convidados DEVE oferecer busca por nome, filtro de status, badges com texto, ações de adicionar/importar e acesso claro às operações existentes e detalhes privados.
- **FR-021**: Mensagens DEVE preservar a consulta dos recados recebidos, com autor e contexto, estados vazios e legibilidade; não criar modelos com variáveis nesta etapa.
- **FR-022**: O redesign NÃO DEVE apresentar lembretes ou envios em massa como ações disponíveis; preservar apenas compartilhamento que o usuário confirma no canal escolhido.
- **FR-023**: Compartilhar DEVE permitir copiar o link público, visualizar QR Code correspondente e abrir o WhatsApp, preservando a opção de e-mail existente. Download e impressão específicos do QR Code ficam fora desta etapa.
- **FR-024**: Exportar confirmados DEVE ser uma seção com prévia e download CSV existentes; dados exportados devem refletir a mesma lista e os mesmos totais da gestão e preservar o formato atual. Não adicionar PDF ou novas colunas de dados.
- **FR-025**: Todas as seções DEVEM ter estados vazios e erros com próximo passo; nenhuma falha pode ser apresentada como operação concluída.
- **FR-026**: A interface DEVE cumprir WCAG AA: contraste mínimo 4,5:1 em texto comum, 3:1 em texto grande e controles aplicáveis, foco visível, labels, operação por teclado e status não dependentes só de cor.
- **FR-027**: Alvos de toque DEVEM ter pelo menos 44px; escolhas de RSVP, pelo menos 48px. Em 375px, 768px e 1280px não deve haver rolagem horizontal da página; abas móveis podem rolar dentro do próprio componente.
- **FR-028**: Textos DEVEM usar português do Brasil, tom acolhedor e direto; datas e horas devem ser compreensíveis nesse idioma.
- **FR-029**: Animações DEVEM durar no máximo 250ms, não bloquear tarefas e respeitar a preferência por movimento reduzido; imagens não devem comprometer leitura nem resposta no celular.
- **FR-030**: A entrega DEVE começar pela área pública: Convite → Responder → Editar. Antes dessa implementação, apresentar tokens escolhidos e arquivos previstos. Após demonstrar a área pública, aguardar aprovação explícita antes de implementar o organizador.
- **FR-031**: Após aprovação da área pública, implementar o organizador na ordem Meus eventos → Evento → Convidados → Compartilhar → Mensagens → Exportar; essa ordem de entrega não altera a ordem da navegação do FR-001.
- **FR-032**: A feature NÃO DEVE incluir pagamento, check-in, analytics, multi-tenant ou login social. Manter a plataforma existente, sem reescrita ou adoção de uma biblioteca de interface apenas por referência; reutilizar a base visual compartilhada.

### Key Entities

- **Identidade visual compartilhada**: conjunto coerente de cores, tipografia, espaçamento, forma, foco e estados usado nas duas jornadas.
- **Evento**: dados e conteúdos existentes, sua apresentação pública, capa derivada das imagens disponíveis e destaque de apresentação sem novo campo persistido.
- **Convidado e acompanhantes**: cadastros existentes, vínculos, status e detalhes privados; totais derivados dos registros existentes.
- **Resposta RSVP**: decisão confirmada ou recusada, acompanhantes, mensagem e data de atualização, sem novos campos.
- **Acesso privado de edição**: link existente que permite alterar uma resposta específica, distinto do link público do evento.
- **Mensagem recebida**: recado privado já enviado pelo convidado e consultável pelo organizador.
- **Prévia de exportação**: representação dos confirmados e acompanhantes consistente com os arquivos baixados.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em validação com cinco pessoas, incluindo ao menos duas com 60 anos ou mais, pelo menos quatro conseguem abrir o convite, responder e localizar o link de edição sem ajuda em até dois minutos.
- **SC-002**: Em 375px, 768px e 1280px, 100% das telas do escopo são utilizáveis sem rolagem horizontal da página, sobreposição de ações ou perda de conteúdo ao ampliar texto em 200%.
- **SC-003**: 100% das jornadas críticas podem ser concluídas por teclado, com foco visível, labels e contrastes exigidos; nenhum status é comunicado somente por cor.
- **SC-004**: Respostas, totais e exportações coincidem nos cenários de pessoa sozinha, acompanhantes, recusa, inativação, exclusão e mesclagem; não há perda de dados antigos nem dupla contagem.
- **SC-005**: Em cinco tentativas de uso por pessoas do público-alvo, pelo menos quatro identificam a resposta escolhida e como alterá-la depois, sem explicação externa.
- **SC-006**: Em celular com conexão móvel de referência de 10 Mbps e latência de 150ms, o conteúdo principal do convite fica visível em até três segundos em pelo menos nove de dez aberturas sem cache.
- **SC-007**: Todas as seções administrativas têm estados de vazio, erro e carregamento verificáveis, e o organizador encontra cada seção a partir do evento selecionado com uma única ação de navegação.
- **SC-008**: A área pública é demonstrada e aprovada antes do início da implementação administrativa; a revisão confirma uma identidade tipográfica e cromática consistente nas telas entregues.

## Assumptions

- Uso pessoal para eventos familiares, sem comercialização ou novas funções de negócio fora da lista.
- A feature anterior continua sendo referência das regras existentes; conflitos identificados não autorizam alterações silenciosas.
- Esta etapa produz especificação, não implementação nem publicação. Tokens finais, arquivos afetados e soluções técnicas serão definidos no planejamento e apresentados antes das alterações visuais.
- Fraunces e DM Sans são a direção tipográfica inicial. A direção cromática inicialmente apresentada foi substituída pela paleta pastel lavanda/azul fornecida pelo usuário em 15/10/2026; texto, botões e cores semânticas devem manter contraste acessível.
- Partiful e Paperless Post são referências de atmosfera e hierarquia, não de reprodução de layouts, marcas ou materiais.
- Um toque seleciona a decisão; a gravação ocorre após confirmação, com nome obrigatório quando necessário ao fluxo atual e demais campos opcionais.
- Quando não houver informação confiável de anfitrião, usar “Você está convidado” em vez de inventar um nome.
- Convites antigos permanecem compatíveis e não ganham expiração, cancelamento ou capacidade física presumidos.
- O compartilhamento existente abre o canal escolhido para confirmação do usuário; não haverá modelos, lembretes ou serviços de disparo nesta etapa.
- Dados pessoais não devem aparecer em endereços compartilháveis em texto legível; os links de edição existentes continuam privados e não autorizam listar convidados.
- Os testes com pessoas e a aprovação visual exigem participação do usuário e não podem ser declarados realizados por testes automatizados.

## Clarifications

### Session 2026-10-15

- Q: O redesign inclui os novos comportamentos listados? → A: Não. Priorizar visual e usabilidade; “Talvez”, novos campos, links individuais de convite, calendário, modelos de mensagens, PDF e novas regras de disponibilidade ficam para outra feature.
- Q: Como tratar adultos/crianças em relação aos acompanhantes existentes? → A: Preservar acompanhantes com nome/idade, sem contadores preenchíveis e sem dupla contagem; totais derivados dos registros existentes.
- Q: Criar cancelamento, prazo e capacidade física nesta etapa? → A: Não. Manter disponibilidade e bloqueios existentes, com mensagens apenas para estados reais.
- A lista original de desejos permanece como referência de evolução, não como autorização para implementar as extensões adiadas. Nenhuma feature adicional foi criada nesta invocação.
