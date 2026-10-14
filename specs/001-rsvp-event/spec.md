# Feature Specification: RSVP de Festa

**Feature Branch**: `001-rsvp-event`

**Created**: 2026-10-05

**Status**: Approved

**Input**: Escopo validado para um aplicativo web de RSVP de festa, responsivo e acessível pela internet. O anfitrião precisa se autenticar para criar e gerir eventos; convidados não precisam de conta ou login para consultar o evento e responder ao RSVP. Inclui galeria de fotos referenciadas por URLs públicas, localização no Google Maps, compartilhamento por QR Code, WhatsApp e e-mail, mensagens, gestão visual de respostas, edição, exportação CSV e proteção opcional da página pública por senha como candidata à V2.

## Clarifications

### Session 2026-10-05

- Q: Quem precisa se autenticar para usar o sistema? → A: Somente o anfitrião se autentica; convidados consultam o evento e enviam RSVP sem conta ou login.
- Q: A lista do anfitrião deve identificar convidados que ainda não responderam, ou mostrar somente quem já enviou um RSVP? → A: O anfitrião cadastra convidados; a lista mostra pendentes, confirmados e recusados.
- Q: Como um convidado sem conta deve associar o RSVP ao nome cadastrado pelo anfitrião? → A: O convidado digita o nome; o anfitrião resolve duplicatas manualmente.
- Q: Como o anfitrião deve criar a conta, entrar e recuperar o acesso se esquecer as credenciais? (CHK001) → A: Cadastro e acesso por e-mail e senha, com redefinição de senha por e-mail; o anfitrião pode sair da conta.
- Q: Que proteção o MVP deve aplicar a envios anônimos repetidos, mensagens abusivas e tentativas inválidas? (CHK002) → A: Rejeitar envios para eventos inválidos ou não publicados, opções de RSVP inválidas e mensagens acima de 500 caracteres; não haverá limite confiável por pessoa nem moderação automática, e o risco residual é aceito.
- Q: Quais dados de RSVP ainda não associados devem ficar na inbox, por quanto tempo e como o anfitrião deve resolvê-los? (CHK003) → A: Manter nome, decisão, mensagem opcional e data de envio na fila privada até associação ou exclusão manual, sem expiração automática; após associação, o registro permanece como RSVP privado. Duplicatas são resolvidas manualmente e envios sem correspondência podem ser descartados.
- Q: O que convidados sem login podem consultar e enviar, e quais dados devem permanecer privados? (CHK004) → A: Convidados leem somente o evento publicado e podem enviar RSVP e mensagem; não leem lista, inbox, mensagens ou respostas de outras pessoas. O link de edição dá acesso somente à própria resposta.
- Q: Que requisitos de acessibilidade devem ser garantidos para fotos, navegação por teclado e links? (CHK005) → A: Fotos informativas e imagem do local têm texto alternativo; controles e links funcionam por teclado, com foco visível e nomes acessíveis.
- Q: Que limite deve orientar as decisões assumidas para os demais itens desta revisão? → A: Adotar recomendações sem custo financeiro adicional nem degradação de desempenho para as demais funcionalidades.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preparar e divulgar o evento (Priority: P1)

Como anfitrião, quero criar o evento, apresentar suas informações, fotos e localização no Google Maps e compartilhar o link por QR Code, WhatsApp ou e-mail, para que os convidados encontrem os detalhes da festa e possam responder.

**Why this priority**: Sem um evento publicado e acessível, convidados não conseguem participar do RSVP.

**Independent Test**: Criar um evento com título, data e horário, adicionar descrição e URLs públicas de fotos, e abrir o link público em outro dispositivo.

**Acceptance Scenarios**:

1. **Given** que o anfitrião iniciou a criação, **When** informa os dados obrigatórios e salva, **Then** o evento fica disponível para configuração e divulgação.
2. **Given** que o evento foi criado, **When** o anfitrião abre as opções de compartilhamento, **Then** pode copiar o link, mostrar o QR Code ou compartilhar por WhatsApp e e-mail.

#### 🎉 Feature 1 - Anfitrião cria evento

- **Descrição**: O anfitrião cria um evento informando título, data, horário e local. A descrição pode ser completada na configuração do evento.
- **Ator**: Anfitrião.
- **Fluxo**:
  1. O anfitrião cria uma conta com e-mail e senha ou entra em sua conta existente; se esquecer a senha, solicita uma redefinição por e-mail.
  2. O anfitrião abre a opção de criar evento.
  3. Preenche título, data, horário e local.
  4. Confere os dados e salva.
  5. O sistema cria o evento e associa sua gestão à identidade autenticada do anfitrião.
  6. O anfitrião continua para a edição da página do evento e pode sair da conta.
- **Tela esperada**:

```text
+----------------------------------+
| Criar evento                     |
| Título:     [________________]   |
| Data:       [____/____/______]   |
| Horário:    [____:____]          |
| Local:      [________________]   |
|                                  |
|               [Criar evento]     |
+----------------------------------+
```

- **Critérios de aceitação**:
  - O sistema exige título, data e horário válidos antes de criar o evento.
  - Após salvar, o anfitrião recebe confirmação e consegue acessar a edição do evento.
  - O anfitrião precisa estar autenticado para criar o evento.
  - Convidados não precisam se autenticar para consultar ou responder ao evento.
  - O anfitrião consegue criar uma conta, entrar, sair e solicitar redefinição de senha por e-mail.

#### 📸 Feature 2 - Anfitrião adiciona referências de fotos e descrição

- **Descrição**: O anfitrião adiciona descrição, textos de apoio e URLs públicas de fotos hospedadas em um serviço externo para apresentar o evento em uma galeria.
- **Ator**: Anfitrião.
- **Fluxo**:
  1. O anfitrião abre a edição do evento.
  2. Escreve ou altera a descrição e os textos de apoio.
  3. Informa a URL pública de cada foto e revisa a prévia.
  4. Salva as alterações.
- **Tela esperada**: Formulário de edição com campos de descrição e textos, campo para URL de cada foto, prévias das imagens e ação para salvar. A prévia da página mostra como o conteúdo aparecerá ao convidado.
- **Critérios de aceitação**:
  - O anfitrião consegue adicionar URLs públicas de fotos e textos à página do evento.
  - As URLs de imagens usam HTTPS e cada foto informativa tem texto alternativo.
  - O anfitrião consegue informar texto alternativo para cada foto informativa.
  - O sistema guarda as referências das fotos, sem enviar os arquivos para o banco de dados do evento.
  - O anfitrião consegue revisar o conteúdo antes de publicá-lo.
  - A página continua utilizável quando o evento não tem fotos.
  - Uma URL inválida ou indisponível não impede a exibição das demais informações do evento.
  - Alterações salvas aparecem na página pública do evento.

#### 📍 Feature 3 - Integrar a localização com Google Maps

- **Descrição**: O anfitrião informa o endereço e, opcionalmente, uma URL HTTPS pública de uma foto do espaço do evento, não de um mapa. Os convidados consultam os dados e podem abrir o Google Maps por um link de direções.
- **Ator**: Anfitrião e convidado.
- **Fluxo**:
  1. O anfitrião informa ou revisa o endereço do evento.
  2. Opcionalmente, o anfitrião informa a URL pública da foto do local e seu texto alternativo, e revisa a prévia.
  3. O convidado abre a página pública e consulta o endereço e, se fornecida, a foto.
  4. O convidado escolhe abrir o link de direções no Google Maps.
- **Tela esperada**: Seção “Localização” com endereço, foto opcional do espaço e ação “Abrir no Google Maps”.
- **Critérios de aceitação**:
  - O anfitrião consegue informar o endereço e, opcionalmente, a foto do espaço com seu texto alternativo.
  - Quando fornecida, a foto pública HTTPS do espaço tem texto alternativo e é exibida sem mapa incorporado.
  - O convidado consegue abrir direções no Google Maps para o endereço informado, sem API ou chave.
  - O anfitrião revisa o destino do link antes de publicar; sem geocodificação externa, o sistema não promete validar se o endereço produz uma rota útil.
  - Se a foto estiver ausente ou indisponível, o endereço e o link de direções continuam disponíveis.

#### 🔗 Feature 4 - Gerar link e QR Code e compartilhar o evento

- **Descrição**: O sistema disponibiliza automaticamente um link público e QR Code e oferece compartilhamento por WhatsApp e e-mail.
- **Ator**: Anfitrião; convidados acessam o evento pelos canais compartilhados.
- **Fluxo**:
  1. O anfitrião abre as opções de compartilhamento do evento.
  2. Copia o link, mostra ou salva o QR Code, ou escolhe WhatsApp ou e-mail.
  3. O sistema prepara a mensagem com o link público e o anfitrião confirma o envio no canal escolhido.
  4. O convidado abre o link ou aponta a câmera para o QR Code.
  5. A página pública correspondente é exibida.
- **Tela esperada**:

```text
+----------------------------------+
| Compartilhar evento              |
| Link: https://...                |
| [Copiar link]      [QR Code]     |
| [WhatsApp]         [E-mail]      |
|                                  |
| Escaneie para abrir o evento     |
+----------------------------------+
```

- **Critérios de aceitação**:
  - Todo evento criado tem um link público próprio e um QR Code correspondente.
  - O link pode ser copiado pelo anfitrião.
  - O QR Code direciona para o mesmo evento que o link público.
  - O botão WhatsApp prepara o compartilhamento com o link correto do evento.
  - O botão de e-mail prepara uma mensagem com o link e o título do evento.
  - O anfitrião confirma o compartilhamento no canal escolhido antes do envio.
  - O link e o QR Code continuam funcionando em dispositivos móveis.

### User Story 2 - Consultar o evento e responder (Priority: P1)

Como convidado, quero consultar os detalhes da festa, confirmar ou recusar presença, deixar uma mensagem e, se necessário, editar minha resposta, sem criar uma conta.

**Why this priority**: A confirmação do convidado é o objetivo principal do RSVP e fornece ao anfitrião uma lista útil para organizar a festa.

**Independent Test**: Abrir o link público em um celular, consultar os dados, enviar uma resposta e uma mensagem, e depois alterar a resposta pelo acesso privado recebido após o envio.

**Acceptance Scenarios**:

1. **Given** que o convidado abriu um evento publicado, **When** consulta a página, **Then** encontra informações, fotos e ações de RSVP sem precisar entrar em uma conta.
2. **Given** que o convidado enviou uma resposta, **When** usa seu acesso privado de edição, **Then** consegue alterar a resposta existente sem criar uma segunda resposta.

#### 🏠 Feature 5 - Convidado visualiza a página do evento

- **Descrição**: A página pública apresenta a galeria de fotos, descrição, textos e informações principais do evento.
- **Ator**: Convidado.
- **Fluxo**:
  1. O convidado abre o link ou QR Code.
  2. Consulta título, data, horário, local, descrição e fotos.
  3. Escolhe confirmar presença, recusar ou deixar mensagem.
- **Tela esperada**:

```text
+----------------------------------+
| Festa de [nome do evento]        |
| [Foto principal]                 |
| Data • Horário • Local           |
| Descrição do evento              |
| [Imagem do local]                |
| Endereço do evento               |
| [Abrir no Google Maps]           |
| [Galeria de fotos]               |
| [Confirmar presença]             |
| [Deixar mensagem]                |
+----------------------------------+
```

- **Critérios de aceitação**:
  - A página mostra os dados, conteúdos e localização publicados pelo anfitrião.
  - A página se adapta a telas móveis e desktop sem exigir rolagem horizontal.
  - O convidado consegue consultar o evento sem criar conta ou fazer login.
  - Links e controles podem ser operados por teclado, exibem foco visível e têm nomes acessíveis.

#### ✅ Feature 6 - Convidado confirma presença

- **Descrição**: O convidado informa o nome cadastrado pelo anfitrião, responde se comparecerá e pode incluir acompanhantes com nome e idade.
- **Ator**: Convidado.
- **Fluxo**:
  1. O convidado abre o link público do evento.
  2. Informa seu nome conforme cadastrado pelo anfitrião e escolhe confirmar presença ou recusar.
  3. Revisa e envia a resposta.
  4. Se o nome corresponder a mais de um convidado, a resposta aguarda a resolução manual do anfitrião.
  5. Recebe confirmação do registro e uma forma privada de editar a resposta.
- **Tela esperada**: Formulário simples com nome, duas opções de resposta, ação de envio e confirmação após o envio.
- **Critérios de aceitação**:
  - O convidado consegue responder sem criar conta ou fazer login.
  - O sistema associa automaticamente o RSVP quando o nome informado corresponde a um único convidado cadastrado.
  - Se o nome corresponder a mais de um convidado, a resposta fica identificada para resolução manual pelo anfitrião.
  - Se nenhum convidado corresponder ao nome informado, o sistema orienta a pessoa a conferir o nome ou contatar o anfitrião, sem alterar o estado de outro convidado.
  - Envios sem correspondência permanecem na inbox privada até o anfitrião excluí-los; eles não alteram o estado de nenhum convidado.
  - A comparação ignora diferenças entre maiúsculas/minúsculas, espaços no início/fim, espaços repetidos e formas Unicode canonicamente equivalentes; acentos e pontuação são preservados.
  - O sistema rejeita a resposta se o evento não existir, não estiver publicado, o nome estiver ausente ou a opção de RSVP for inválida, sem alterar uma resposta existente.
  - O sistema distingue quem confirmou de quem informou que não comparecerá.
  - Após o envio, o convidado recebe confirmação e acesso privado para editar sua resposta.
  - Somente quem confirma presença pode informar até 20 acompanhantes; cada nome tem até 100 caracteres e cada idade é inteira entre 0 e 120.
  - Acompanhantes ficam vinculados ao RSVP principal e não criam respostas ou links de edição independentes.

#### 💬 Feature 7 - Convidado deixa mensagem

- **Descrição**: O convidado envia uma mensagem opcional para o anfitrião junto da resposta de RSVP.
- **Ator**: Convidado.
- **Fluxo**:
  1. O convidado abre o campo de mensagem na página ou no formulário de RSVP.
  2. Escreve a mensagem.
  3. Envia a mensagem junto com a resposta ou, para uma resposta existente, pelo link de edição sem alterar a decisão atual.
  4. Vê uma confirmação de envio.
- **Tela esperada**: Campo de texto identificado como mensagem ao anfitrião, ação de envio e confirmação. O campo não bloqueia o envio do RSVP quando estiver vazio.
- **Critérios de aceitação**:
  - O envio de mensagem é opcional.
  - Uma mensagem sempre acompanha uma resposta nova ou existente; não há submissão de mensagem isolada.
  - A mensagem pode ter até 500 caracteres; mensagens maiores são rejeitadas com orientação para reduzir o texto.
  - A mensagem fica associada ao evento e identificada pelo nome do convidado informado.
  - Mensagens são visíveis ao anfitrião e não aparecem na página pública para outros convidados.
  - Conteúdo enviado é apresentado como texto, sem executar conteúdo ativo inserido na mensagem.

#### ✏️ Feature 8 - Convidado edita sua resposta

- **Descrição**: O convidado altera uma resposta de RSVP previamente enviada sem criar conta.
- **Ator**: Convidado.
- **Fluxo**:
  1. O convidado abre o acesso privado de edição recebido após responder.
  2. Consulta a resposta atual.
  3. Altera a decisão ou a mensagem e, se necessário, corrige o nome para nova associação.
  4. Salva e recebe confirmação da atualização.
- **Tela esperada**: Formulário preenchido com os dados atuais, opções para alterar presença, nome ou mensagem e ação de salvar.
- **Critérios de aceitação**:
  - O convidado consegue editar a resposta sem conta ou login.
  - Salvar uma edição atualiza a resposta existente, sem duplicá-la.
  - Pelo mesmo link, o convidado consegue incluir, editar ou remover acompanhantes; ao recusar presença, os acompanhantes deixam de integrar a resposta.
  - Se o nome for alterado, a resposta volta ao estado de revisão e não altera o estado de nenhum convidado até o anfitrião resolver a associação.
  - O anfitrião vê a resposta atualizada na lista do evento.
  - Um acesso inválido ou destinado a outra resposta não permite consultar ou editar os dados.
  - O anfitrião pode revogar o link e gerar outro para a mesma resposta; o link anterior deixa de funcionar. Não há expiração automática nem reenvio automático.

### User Story 3 - Acompanhar respostas e organizar a lista (Priority: P2)

Como anfitrião, quero cadastrar convidados e acompanhar quem está pendente, quem confirmou e quem recusou, além de ver mensagens e exportar os confirmados, para organizar a festa.

**Why this priority**: O acompanhamento e a exportação transformam as respostas dos convidados em informação prática para o anfitrião.

**Independent Test**: Cadastrar convidados, enviar respostas com seus nomes e mensagens, resolver nomes duplicados, abrir a área do anfitrião, verificar os três estados e exportar os confirmados.

**Acceptance Scenarios**:

1. **Given** que o anfitrião cadastrou convidados e alguns responderam, **When** abre a área de gestão, **Then** encontra grupos visuais de pendentes, confirmados e recusados, além das mensagens atualizadas; cada acompanhante confirmado conta como participante adicional.
2. **Given** que há participantes confirmados, **When** o anfitrião exporta a lista, **Then** recebe um arquivo CSV com uma linha por participante e sem mensagens privadas.

#### 📋 Feature 9 - Anfitrião cadastra convidados e acompanha respostas

- **Descrição**: O anfitrião cadastra os convidados esperados e acompanha visualmente quem ainda está pendente, quem confirmou, quem recusou e as mensagens recebidas. Acompanhantes aparecem sob o convidado principal, com nome e idade.
- **Ator**: Anfitrião.
- **Fluxo**:
  1. O anfitrião abre a área privada de gestão do evento.
  2. Cadastra os nomes dos convidados esperados.
  3. Consulta os totais e as listas de pendentes, confirmados e recusados.
  4. Resolve manualmente respostas associadas a nomes duplicados.
  5. Consulta as mensagens recebidas.
  6. Acompanha respostas e mensagens conforme chegam.
- **Tela esperada**:

```text
+----------------------------------+
| Gestão do evento                 |
| Pendentes: 8                     |
| Confirmados: 24                  |
| Recusados: 3                     |
|                                  |
| Pendentes                        |
| Carla Souza      Sem resposta    |
| Revisar associação               |
| Alex Silva       Nome duplicado  |
| Confirmaram                      |
| Ana Silva       Confirmada       |
| Recusaram                        |
| Bruno Lima      Não comparecerá  |
|                                  |
| Mensagens recentes               |
| Ana: Até lá!                     |
+----------------------------------+
```

- **Critérios de aceitação**:
  - O anfitrião consegue cadastrar convidados esperados; cada novo convidado começa com estado pendente.
  - O sistema permite no máximo 100 convidados cadastrados por evento e informa o limite ao anfitrião.
  - O anfitrião consegue consultar os convidados cadastrados separados entre pendentes, confirmados e recusados.
  - Cada acompanhante aparece como participante adicional sob o RSVP principal e soma um ao total de confirmados; pendentes e recusados continuam contando somente os convidados cadastrados.
  - Uma resposta recebida atualiza o estado do convidado correspondente; quem não respondeu permanece pendente.
  - O anfitrião consegue associar manualmente uma resposta ao convidado correto quando nomes cadastrados forem duplicados.
  - Uma resposta com nome duplicado não altera o estado de um convidado até que o anfitrião resolva a associação.
  - O anfitrião consegue consultar todas as mensagens recebidas do evento.
  - O anfitrião consegue excluir envios sem correspondência; envios com nomes duplicados permanecem pendentes até a associação manual.
  - Uma nova resposta ou mensagem aparece na área de gestão em até cinco segundos, sem recarga manual.
  - O prazo de cinco segundos é medido após a gravação aceita enquanto o anfitrião está conectado e com a gestão aberta; envios recebidos enquanto ele está offline aparecem quando voltar a abrir a gestão.
  - Convidados não conseguem visualizar a lista completa nem as mensagens de outras pessoas.
  - Somente convidados cadastrados pelo anfitrião podem aparecer como pendentes; pessoas não cadastradas não são contadas como convidadas sem resposta.

#### 📤 Feature 10 - Anfitrião exporta a lista em CSV

- **Descrição**: O anfitrião baixa a lista de participantes confirmados do evento em formato CSV, com uma linha para cada convidado principal e cada acompanhante.
- **Ator**: Anfitrião.
- **Fluxo**:
  1. O anfitrião abre a área de gestão do evento.
  2. Aciona a opção de exportar confirmados.
  3. Recebe um arquivo CSV que pode abrir em uma ferramenta compatível com planilhas.
- **Tela esperada**: Ação “Exportar confirmados (CSV)” junto da lista de presença; após a solicitação, o navegador disponibiliza o arquivo.
- **Critérios de aceitação**:
  - O CSV inclui todos e somente os participantes confirmados do evento selecionado, incluindo acompanhantes.
  - O arquivo identifica nome, idade dos acompanhantes, convidado principal, situação da resposta e data da última resposta.
  - O arquivo preserva acentos e caracteres especiais dos nomes.
  - Mensagens privadas e respostas negativas não são incluídas na exportação de confirmados.
  - Se não houver confirmados, o anfitrião recebe um arquivo válido vazio ou uma mensagem clara de que não há dados para exportar.

#### 🧭 Feature 11 - Header e menu variam entre anfitrião e convidado

- **Descrição**: O cabeçalho apresenta navegação e ações compatíveis com a área de anfitrião ou a página do convidado.
- **Ator**: Anfitrião e convidado.
- **Fluxo**:
  1. O anfitrião se autentica e abre a área de gestão de um evento que criou.
  2. O convidado abre o link público e encontra ações para consultar e responder ao evento.
  3. Cada pessoa usa apenas as opções disponíveis no respectivo contexto.
- **Tela esperada**:

```text
Anfitrião: [Evento] [Convidados] [Mensagens] [Compartilhar] [Exportar] [Conta] [Sair]
Convidado: [Sobre a festa] [Fotos] [RSVP] [Mensagem]
```

- **Critérios de aceitação**:
  - A área do anfitrião apresenta acesso à gestão de convidados, mensagens e compartilhamento/exportação.
  - A página do convidado apresenta acesso às informações do evento e às ações de RSVP.
  - A navegação do convidado não exibe ações administrativas nem dados privados.
  - Somente o anfitrião autenticado que criou o evento consegue acessar sua área de gestão.
  - Um anfitrião autenticado não consegue acessar a área de gestão de eventos de outra pessoa.
  - Convidados não precisam se autenticar para acessar a navegação pública e responder ao evento.
  - A navegação permanece utilizável em telas móveis.

### Edge Cases

- A imagem estática do local é inválida ou indisponível; o endereço e o link de direções continuam funcionais.
- Uma URL de foto é inválida, removida ou indisponível; a galeria mostra um estado alternativo e mantém o restante da página funcional.
- WhatsApp ou e-mail não estão disponíveis no dispositivo; o anfitrião ainda pode copiar o link ou usar o QR Code.
- O evento não possui respostas negativas; o grupo correspondente apresenta um estado vazio sem erro.
- O anfitrião precisa cadastrar os convidados esperados para que apareçam como pendentes; pessoas não cadastradas não podem ser identificadas nem contadas.
- Dois ou mais convidados cadastrados têm o mesmo nome; o anfitrião precisa associar a resposta à pessoa correta antes de atualizar o estado.
- O nome informado não corresponde a nenhum convidado cadastrado; nenhum estado de RSVP é alterado.
- A comparação de nomes ignora caixa, espaços externos/repetidos e equivalências Unicode canônicas, mas preserva acentos e pontuação; nomes que diferem apenas por acento não são associados automaticamente.
- Um RSVP sem correspondência permanece na inbox privada até ser excluído pelo anfitrião; não expira automaticamente e não altera o roster.
- Uma submissão aponta para um evento inexistente ou não publicado, omite o nome, usa uma opção de RSVP inválida ou contém uma mensagem acima de 500 caracteres; o envio é rejeitado sem alterar respostas existentes.
- Envios anônimos repetidos e mensagens abusivas dentro dos limites de formato e tamanho não têm limite confiável por pessoa nem moderação automática no MVP; o risco residual de abuso é aceito.
- O nome digitado não comprova a identidade do convidado; o risco de uma pessoa responder por outra é aceito no MVP.
- Um reenvio pelo formulário público cria uma nova submissão independente; após a associação, a decisão da submissão aceita mais recentemente define o estado do convidado. Para alterar a resposta existente sem criar outro registro, o convidado deve usar seu link de edição; gravações simultâneas pelo mesmo link seguem a última gravação aceita.
- Um link de edição é compartilhado ou obtido por outra pessoa; essa pessoa pode consultar e alterar somente a resposta correspondente até o anfitrião revogar o link.
- Uma URL pública externa é removida ou o provedor registra dados de acesso; a página mostra alternativa para a imagem indisponível e informa que o provedor externo pode receber IP e metadados de carregamento.
- O endereço está incompleto ou não gera rota útil; o endereço digitado continua visível e o link abre o Google Maps com o destino codificado, sem promessa de validar a rota.
- O evento já tem 100 convidados cadastrados ou o Firebase rejeita uma conexão/gravação no limite Spark; o sistema informa o limite ou falha recuperável, preserva os dados não enviados e orienta nova tentativa.
- O anfitrião não está autenticado ou tenta gerir um evento que não criou; os controles privados permanecem inacessíveis.
- O convidado tenta ler a lista, inbox, mensagem privada ou RSVP de outra pessoa; o acesso é negado. O link individual só autoriza a resposta correspondente.
- Um convidado envia RSVP sem login; somente os dados necessários à resposta são aceitos e dados privados do evento não são expostos.
- A proteção por senha pertence à V2 e não pode bloquear ou alterar o RSVP sem senha no MVP.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que um anfitrião autenticado crie um evento e associar o evento à identidade que o criou.
- **FR-002**: O sistema MUST exigir título, data e horário válidos para criar um evento.
- **FR-003**: O sistema MUST permitir que o anfitrião informe o local, a descrição e textos de apoio do evento.
- **FR-004**: O sistema MUST permitir que o anfitrião adicione URLs HTTPS públicas de fotos hospedadas externamente à galeria, informar texto alternativo para cada foto informativa e revisar a página antes de divulgá-la, sem enviar os arquivos para o banco de dados do evento.
- **FR-005**: O sistema MUST gerar um link público e um QR Code correspondentes para cada evento criado e disponibilizar opções de compartilhamento.
- **FR-006**: O sistema MUST apresentar aos convidados a página pública com informações e fotos publicadas pelo anfitrião.
- **FR-007**: A página pública MUST ser utilizável em dispositivos móveis e desktop sem rolagem horizontal nos viewports de 360 px e 1280 px.
- **FR-008**: O sistema MUST permitir que o convidado informe o nome cadastrado pelo anfitrião e confirme ou recuse presença sem conta ou login.
- **FR-009**: O sistema MUST permitir que o convidado envie uma mensagem opcional junto de uma resposta nova ou existente, sem exigir alteração da decisão já registrada.
- **FR-010**: O sistema MUST permitir que o convidado consulte e edite somente sua resposta por um link privado, sem criar uma conta; o anfitrião pode revogar e substituir o link, que não expira automaticamente. Alterar o nome coloca a associação em revisão sem alterar o estado de outro convidado.
- **FR-011**: O sistema MUST apresentar ao anfitrião conectado, com a gestão aberta, os convidados cadastrados como pendentes, confirmados ou recusados e as mensagens em até cinco segundos após a gravação aceita; submissões recebidas enquanto o anfitrião estiver offline ficam na inbox até a próxima abertura da gestão.
- **FR-012**: O sistema MUST manter a lista completa de convidados e as mensagens privadas indisponíveis na página pública.
- **FR-013**: O sistema MUST permitir que o anfitrião exporte em CSV todos e somente os confirmados do evento selecionado.
- **FR-014**: O sistema MUST apresentar ao convidado navegação para as informações, fotos, RSVP e mensagem do evento; ao anfitrião proprietário, MUST apresentar navegação para gestão de convidados, mensagens, compartilhamento e exportação. A navegação pública MUST ocultar ações administrativas.
- **FR-015**: O sistema MUST exigir autenticação e propriedade do evento para permitir que o anfitrião acesse ou altere seus controles privados; convidados não precisam de conta ou login para consultar e responder ao evento.
- **FR-016**: O sistema MUST permitir que o anfitrião associe um endereço e, opcionalmente, uma URL HTTPS pública de uma foto do espaço do evento com texto alternativo; o convidado consulta os dados e abre direções no Google Maps por um link construído com o endereço, sem mapa incorporado ou Maps API.
- **FR-017**: O sistema MUST oferecer ao anfitrião o compartilhamento do link público do evento pelo WhatsApp.
- **FR-018**: O sistema MUST oferecer ao anfitrião o compartilhamento do link público por e-mail, incluindo o título do evento.
- **FR-019**: O sistema MUST permitir que o anfitrião cadastre os convidados esperados para que cada pessoa tenha um estado pendente até enviar uma resposta.
- **FR-020**: O sistema MUST comparar nomes ignorando caixa, espaços externos/repetidos e formas Unicode canonicamente equivalentes, preservando acentos e pontuação; associar automaticamente uma correspondência única, permitir resolução manual de duplicatas e orientar o convidado quando não houver correspondência, sem alterar o estado de outra pessoa.
- **FR-021**: O sistema MUST permitir que o anfitrião crie uma conta e se autentique com e-mail e senha, saia da conta e solicite a redefinição da senha por e-mail.
- **FR-022**: O sistema MUST rejeitar submissões para eventos inexistentes ou não publicados, sem nome, com opção de RSVP inválida ou com mensagem acima de 500 caracteres, sem alterar uma resposta existente.
- **FR-023**: O sistema MUST manter na fila privada os dados necessários à associação de uma submissão (nome informado, decisão, mensagem opcional, data e estado) até associação ou exclusão manual, sem expiração automática; após associação, o registro permanece como RSVP privado. O anfitrião MUST conseguir resolver manualmente nomes duplicados e excluir envios sem correspondência.
- **FR-024**: Convidados sem login MUST poder ler somente o conteúdo público do evento e criar uma submissão de RSVP com mensagem opcional; não podem ler roster, inbox, mensagens privadas ou respostas de outras pessoas. Um link de edição MUST permitir acesso somente à resposta correspondente.
- **FR-025**: O sistema MUST fornecer texto alternativo para fotos informativas e para a imagem do local; links e controles MUST ter nomes acessíveis, funcionar por teclado e exibir foco visível.
- **FR-026**: O sistema MUST permitir até 100 convidados cadastrados por evento, independentemente de conexões simultâneas; se um envio falhar por indisponibilidade ou limite de conexões, deve preservar os dados do formulário e informar que o convidado pode tentar novamente.
- **FR-027**: O sistema MUST usar o endereço informado para construir o link de direções, codificando-o como destino; o anfitrião deve revisar o destino antes da publicação, e o endereço permanece visível mesmo se o Maps não conseguir gerar uma rota útil.
- **FR-028**: A página pública MUST apresentar, junto às imagens hospedadas externamente, um aviso visível de que seus provedores podem receber o endereço IP e metadados de carregamento do visitante; o aviso não deve bloquear nem atrasar o carregamento das imagens.

### Key Entities *(include if feature involves data)*

- **Evento**: Festa criada pelo anfitrião, com título, data, horário, local, descrição, textos e acesso público.
- **Conta do anfitrião**: Identidade autenticada proprietária dos eventos que criou e autorizada a gerir seus dados privados.
- **Localização do evento**: Endereço, URL pública opcional e texto alternativo da imagem estática do local, além do link de direções no Google Maps.
- **Foto**: Referência a uma imagem hospedada externamente, composta por URL pública e texto de apoio opcional.
- **Resposta RSVP**: Registro de nome, decisão de presença e data da última atualização, associado ao convidado cadastrado correspondente.
- **Convidado cadastrado**: Pessoa adicionada pelo anfitrião à lista do evento, inicialmente pendente e associada à resposta quando recebida; nomes duplicados exigem resolução manual.
- **Mensagem**: Texto opcional de um convidado, associado ao evento e à sua resposta, visível ao anfitrião.
- **Acesso privado**: Sessão autenticada do anfitrião proprietário para gerir o evento, ou link individual que permite ao convidado editar sua própria resposta sem login.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um anfitrião consegue criar um evento e obter seu link e QR Code em até cinco minutos, sem assistência.
- **SC-002**: Um convidado consegue consultar o evento e registrar uma resposta em até um minuto após abrir o link público.
- **SC-003**: Pelo menos 95% dos participantes de um teste de uso conseguem concluir o RSVP em sua primeira tentativa em um celular.
- **SC-004**: Com a área de gestão aberta e conexão ativa do anfitrião, submissões RSVP e mensagens aceitas ficam visíveis em até cinco segundos após a gravação; se ele estiver offline, aparecem na próxima abertura da gestão, sem SLA durante a desconexão.
- **SC-005**: A exportação contém 100% dos confirmados e 0% dos convidados que não confirmaram presença.
- **SC-006**: Nenhuma mensagem privada ou lista completa de convidados é apresentada na página pública.
- **SC-007**: Em 100% dos eventos com endereço informado, a página apresenta o endereço e um link do Google Maps cujo destino codificado corresponde ao endereço; foto do espaço é opcional e sua falha não impede o uso do link.
- **SC-008**: Os compartilhamentos por WhatsApp e e-mail incluem o link público do evento correto.

## Assumptions

- O anfitrião precisa se autenticar para criar e gerir eventos; cada evento pertence à identidade autenticada que o criou. Convidados não precisam de conta ou login para consultar o evento e enviar RSVP.
- Depois de enviar o RSVP, o convidado recebe um acesso privado para editar somente sua resposta. O convidado precisa guardar esse acesso para voltar a editá-la.
- Cada resposta representa um convidado individual; RSVP em nome de grupos ou acompanhantes não está incluído nesta versão.
- A lista de pendentes inclui somente pessoas cadastradas pelo anfitrião; sem cadastro prévio, o sistema não sabe quem foi convidado e ainda não respondeu.
- O convidado informa o nome cadastrado para associar a resposta. A comparação ignora caixa e espaços externos/repetidos, normaliza formas Unicode canônicas e preserva acentos e pontuação; nomes duplicados são resolvidos manualmente.
- Como convidados não entram em uma conta, o nome digitado não comprova identidade; o risco de resposta em nome de outra pessoa é aceito no MVP.
- Cada evento admite até 100 convidados cadastrados; isso não representa 100 conexões simultâneas. O limite Spark é de 100 conexões simultâneas por instância, incluindo anfitriões; não há garantia de acesso simultâneo para todos os convidados.
- O token de edição é um segredo bearer sem expiração automática; quem o obtiver pode ler ou editar somente a resposta correspondente. O anfitrião pode revogar o token e emitir outro; o convidado deve pedir novo acesso ao anfitrião, sem reenvio automatizado.
- Submissões anônimas têm validação de evento, formato e tamanho, mas não têm limitação confiável por pessoa nem moderação automática de mensagens; o risco residual de spam e conteúdo abusivo é aceito no MVP.
- As únicas opções de RSVP nesta versão são “Confirmarei presença” e “Não poderei comparecer”.
- Mensagens são privadas entre convidado e anfitrião; não há comentários públicos entre convidados.
- A exportação CSV inclui apenas confirmados, sem mensagens.
- O anfitrião fornece as URLs HTTPS públicas das fotos da galeria e da foto opcional do espaço, e é responsável por ter direito de publicá-las. Os provedores podem receber o IP e metadados de carregamento dos visitantes; disponibilidade e política de privacidade são externas. Nenhum provedor ou custo será escolhido nesta fase.
- A localização usa uma foto do espaço, não uma imagem cartográfica. Sem API de geocodificação, o anfitrião confere o destino do link; o endereço informado é exibido como alternativa se a rota não for útil.
- Criação de convites individuais, limite de capacidade, lembretes automáticos, pagamentos e integração com calendário estão fora do escopo desta versão.

## Future Considerations

### 🔐 Feature 12 - Proteção opcional da página pública por senha (V2)

- **Descrição**: Em uma versão futura, poderá haver uma senha opcional, separada da autenticação do anfitrião, para restringir o acesso dos convidados à página pública.
- **Ator**: Anfitrião configura a proteção; convidado informa a senha para consultar o evento.
- **Fluxo**:
  1. O anfitrião escolhe ativar ou não a proteção adicional da página pública.
  2. Se ativada, define uma senha de acesso para os convidados, independente da autenticação do anfitrião.
  3. O convidado abre o link público e informa a senha antes de visualizar os detalhes.
  4. Se a senha estiver correta, o convidado acessa a página e pode continuar o RSVP.
- **Tela esperada**: Configuração opcional da senha pública e, para convidados, uma tela de acesso com campo de senha antes da página protegida.
- **Critérios candidatos para V2**:
  - A proteção é opcional e desativada por padrão.
  - Com proteção ativa, a página do evento não revela informações antes da senha correta.
  - A senha não exige criação de conta ou autenticação por login.
  - A ausência ou incorreção da senha não expõe mensagens, respostas ou dados privados.
- **Escopo**: Fora do MVP atual; detalhes de recuperação e alteração da senha de acesso público precisam ser definidos antes da implementação da V2.
