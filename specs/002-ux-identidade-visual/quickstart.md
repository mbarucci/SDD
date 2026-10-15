# Guia de validação do redesign

Este guia descreve verificações e registra resultados observados da implementação pública.

## Registro do gate pré-implementação

- **Tokens apresentados inicialmente**: creme `#F8F3EA`, superfície `#FFFCF6`, texto `#3F2E26`, secundário `#6F5B50`, terracota `#A3472F`/hover `#853823`, confirmado `#285D45`, recusado `#943D3D`, pendente `#645F59`, foco `#245C71`, Fraunces/DM Sans, base 18px, espaçamento 4/8/16/24/32px, raios 12/20px e movimento 180ms.
- **Arquivos apresentados**: `public/fonts/`; `src/index.css`; `src/features/event/eventPresentation.js`, `EventInvitation.jsx`, `PublicEventPage.jsx`, `PublicRsvpCta.jsx`; `src/features/rsvp/RsvpFields.jsx`, `GuestRsvpForm.jsx`, `EditRsvpPage.jsx`; `src/components/CopyLinkControl.jsx`; testes relacionados em `tests/unit/` e `tests/e2e/`; este guia e `tasks.md`.
- **Autorização para iniciar incremento público**: concedida explicitamente pelo usuário nesta sessão, em resposta à apresentação dos tokens e arquivos.
- **Escopo autorizado**: Convite → Responder → Sucesso → Editar. A implementação administrativa continua bloqueada até demonstração e aprovação pública posteriores.
- **Paleta atualizada a pedido do usuário**: após rever as capturas iniciais, o usuário forneceu `#DFC5FF`, `#BCB3E8`, `#D2D6FF`, `#B3C6E8` e `#C5E9FF`. A nova demonstração foi gerada com tons escuros para texto/ações acessíveis.
- **Aprovação do gate público**: em 15/10/2026, o usuário aprovou a paleta revisada e a jornada pública Convite → Responder → Sucesso → Editar, com autorização explícita para iniciar US3.

## Registro de validação do incremento público

- `npm run test:unit`: aprovado, 15 arquivos e 52 testes.
- `npx firebase emulators:exec --only auth,database "npm run test:e2e -- tests/e2e/guest-invitation.spec.js tests/e2e/guest-rsvp.spec.js tests/e2e/guest-rsvp-edit.spec.js tests/e2e/host-rsvp-management.spec.js"`: aprovado, 12 testes; inclui navegação sem login, RSVP, edição, revogação, acompanhantes e responsividade em 375/768/1280px.
- `npm run build`: aprovado. Vite reportou aviso de chunk JavaScript acima de 500 kB; a compilação terminou com sucesso.
- `git diff --check`: aprovado.
- Capturas atualizadas para revisão da paleta (evento fictício, somente emulador): `convite-mobile.png`, `resposta-mobile.png`, `editar-mobile.png`, `convite-desktop.png`, `resposta-desktop.png` e `editar-desktop.png` foram regeneradas na pasta de arquivos da sessão.
- **Revisão/aprovação visual humana**: aprovada pelo usuário para a paleta revisada e os quatro estados públicos demonstrados em mobile e desktop.
- **Gate administrativo**: liberado pelo usuário; US3 pode iniciar. US4/US5 seguem a ordem/dependências de `tasks.md`.

## Pré-requisitos

- Node.js 24.x, dependências do projeto disponíveis e Java compatível com o emulador de banco.
- Navegador do Playwright disponível. Se um comando falhar por dependência ausente, restaurar as dependências pelo gerenciador existente antes de repetir; não instalar ferramentas extras por padrão.
- Configuração local de desenvolvimento conforme instruções existentes do projeto, sem adicionar segredos a arquivos versionados.
- Não testar exclusão/mesclagem em dados reais de família sem autorização. Usar fixtures descartáveis e emuladores.
- Conferir [contratos de UI](./contracts/ui-contracts.md) e [modelo de apresentação](./data-model.md).

## Comandos

Na raiz do repositório:

```bash
npm run test:unit
npm run test:rules
npx firebase emulators:exec --only auth,database "npm run test:e2e -- --workers=1"
npm run build
git diff --check
```

Executar as suítes Rules e E2E em sequência: usam as mesmas portas 9199/9001. O E2E inicia Vite na porta 4173 com configuração de emuladores; não reutilizar um servidor dessa porta apontando a produção.

Para repetir só a jornada pública:

```bash
npx firebase emulators:exec --only auth,database "npx playwright test tests/e2e/guest-rsvp.spec.js tests/e2e/guest-rsvp-edit.spec.js"
```

Atualizar testes existentes aos textos “Vou”, “Não posso” e “Confirmar presença”/“Confirmar resposta”, mantendo asserts de payload, acompanhantes e identidade da resposta.

Para demonstração local com dados descartáveis, iniciar em terminais separados:

```bash
npx firebase emulators:start --only auth,database --project demo-taskify
```

```bash
VITE_FIREBASE_API_KEY=demo-api-key \
VITE_FIREBASE_AUTH_DOMAIN=demo-taskify.firebaseapp.com \
VITE_FIREBASE_DATABASE_URL=https://demo-taskify-default-rtdb.firebaseio.com \
VITE_FIREBASE_PROJECT_ID=demo-taskify \
VITE_FIREBASE_APP_ID=1:000000000000:web:000000000000000000000000 \
VITE_USE_FIREBASE_EMULATORS=true \
npm run dev -- --host 127.0.0.1 --port 4173
```

Valores acima são de emulador, não credenciais de produção. Encerrar os processos específicos ao terminar a demonstração.

## Incremento A — área pública

1. **Convite em 375px, 768px e 1280px**: criar/publicar evento descartável com título/endereço longos e imagens HTTPS. Abrir em contexto sem login; verificar capa, saudação genérica, dados pt-BR, mapa e ação de resposta.
2. **Fallback**: repetir sem fotos e com imagem indisponível; bloquear fontes na ferramenta de rede. Informações e resposta continuam utilizáveis; nenhum nome de anfitrião inventado.
3. **CTA e foco**: verificar a ação no fluxo do convite e a barra fixa quando a ação embutida sai da tela; ela se oculta ao alcançar o RSVP ou quando a ação embutida já está visível. Focar campos com teclado virtual e teclado físico, enviar e verificar confirmação. Nenhuma ação pode cobrir controles ou resultado. Sem movimento reduzido, transições ≤250ms; com a preferência, não há animação decorativa.
4. **Responder**: escolher “Vou”, incluir acompanhantes com nome/idade e recado, confirmar. Verificar sucesso e link de edição em destaque. Recusar em outro envio: texto de sucesso não promete presença, sem terceiro status ou campos novos.
5. **Erros**: interromper gravação simulando falha de rede; formulário mantém valores e instrui repetir. Testar nome vazio, acompanhante inválido e limite de mensagem, preservando validação existente.
6. **Cópia**: copiar link de edição e abri-lo em outro contexto; simular recusa da Clipboard API e verificar alternativa manual e ausência de mensagem falsa de sucesso.
7. **Editar**: reabrir link, verificar valores e resumo salvo, modificar e salvar; confirmar mesmo submissionId. Invalidar/revogar pelo fluxo administrativo existente e verificar indisponibilidade sem campos.
8. **Privacidade**: confirmar ausência de e-mail/telefone privado no convite e de token privado nos links WhatsApp/e-mail públicos; não remover avisos existentes de imagens externas.
9. **Teclado e zoom**: completar jornada sem mouse; foco visível e anunciado, labels corretos, radios operáveis. Ampliar texto em 200% em todas as larguras e verificar ausência de cortes/rolagem horizontal.
10. **Tokens**: conferir cores computadas, tamanho-base 18px, alvos 44/48px e contrastes em estados normal, hover, foco, seleção e erro; cálculos-base em [research.md](./research.md) não substituem essa revisão.

### Gate obrigatório de aprovação

Apresentar Convite, Responder, Sucesso e Editar em celular/desktop ao usuário, com exemplos descartáveis de confirmação e recusa. Registrar a resposta explícita e eventuais ajustes em T019 de `tasks.md`.

**Não iniciar o redesign do organizador enquanto não houver aprovação.** Testes verdes não substituem a decisão visual. Ajustes globais de tokens não devem ter redesenhado o painel durante o primeiro incremento.

## Incremento B — organizador, somente após aprovação

1. **Acesso e Meus eventos**: cadastro/login/recuperação existentes funcionam. Sem eventos, aparece “Criar primeiro evento”. Com dois eventos diferentes, capas, status e resumos correspondem a cada evento; falha de um resumo não resulta em zero falso.
2. **Evento**: conferir ordem exata da navegação e cabeçalho. Alterar título/data/local/fotos e revisar prévia ainda sem salvar; observar que não houve escrita. Salvar/publicar continua explícito com semântica existente. Links da prévia não navegam nem enviam RSVP.
3. **Troca de contexto**: abrir evento A, depois B e Exportar antes de visitar Convidados; nenhum dado de A aparece em B, e exportação aguarda carga do evento atual.
4. **Convidados**: pesquisar nome, filtrar status e limpar filtros. Totais não mudam pelo filtro. Testar homônimos, nome longo, importação CSV/Excel, telefone, associação manual e resposta renomeada.
5. **Acompanhantes e operações**: verificar herança de presença/recusa, pendentes sem acompanhantes vinculados, exclusão cancelada/confirmada, inativos fora de vagas e mesclagem com deduplicação/bloqueios existentes.
6. **Compartilhar**: copiar link e testar alternativa manual; abrir WhatsApp/e-mail com link público correto; ler QR do mesmo evento. Simular erro de geração do QR e conferir orientação para usar o link.
7. **Mensagens**: consultar recados recebidos, autoria, data e contexto; nenhum modelo ou lembrete novo. Verificar estado vazio e recuperação de erro.
8. **Exportar**: comparar a prévia com o conteúdo real do CSV baixado: cabeçalho/BOM, seis colunas, telefone principal, vínculo, escaping e uma linha por participante. Inativos e resultados do filtro não distorcem o arquivo.
9. **Responsividade e acessibilidade**: repetir teclado, zoom, 375/768/1280, alvos e contraste em todas as seções e confirmação destrutiva.

## Desempenho — SC-006

- Usar build de produção e preview local, com as mesmas variáveis de emulador no momento do build; não servir um build configurado para produção como se fosse teste isolado.
- Preparar evento publicado no emulador e usar Chrome DevTools ou recursos de emulação de rede do Playwright: download/upload de referência 10 Mbps e latência 150ms, cache desabilitado.
- Fazer dez aberturas frias do convite em 375px; registrar tempo até capa ou fallback, título, data/local e ação principal visíveis e utilizáveis. Pelo menos nove devem ocorrer em até três segundos.
- Medir também falha/lentidão da imagem: não aguardar imagem externa para renderizar texto/ação. Reservar dimensões, não solicitar todas as fotos com prioridade e não carregar fontes remotas.
- Registrar ambiente, conteúdo usado e resultados. Uma medição local não comprova a latência real do Firebase; confirmar em ambiente de homologação autorizado antes da aceitação final de desempenho.
- Restaurar build normal antes de qualquer publicação autorizada; publicação não faz parte deste comando.

## Sessão com usuários — SC-001 e SC-005

Convidar cinco pessoas, pelo menos duas com 60 anos ou mais. Sem instrução passo a passo, pedir para abrir convite, responder e localizar como editar. Cronometrar e registrar sucesso/ajuda/erros sem coletar dados pessoais desnecessários.

Aceite: pelo menos quatro completam em até dois minutos e pelo menos quatro identificam a decisão e o caminho para alterá-la. Sessão não executada ou amostra incompleta deve permanecer pendente, nunca substituída por teste automatizado.

## Registro de conclusão

### Organizador — incremento validado

- **Escopo concluído**: acesso e lista de eventos; cabeçalho/resumos por evento; navegação contextual; prévia local e inerte; busca e filtro sem alterar o roster; mensagens privadas; compartilhamento por link/WhatsApp/e-mail e QR Code; prévia e download CSV.
- **Gate**: aprovação explícita da área pública registrada acima; implementação administrativa executada na sequência T020–T035.
- **T020–T035**: concluídas e marcadas em `tasks.md`.
- **T036**: permanece pendente para revisão completa de todas as superfícies. O teste automatizado `host-accessibility.spec.js` verifica foco visível, contraste do CTA (≥4,5:1), badge de status (≥4,5:1), foco (≥3:1), alvos de toque e ausência de rolagem horizontal nas larguras 375/768/1280px com texto a 200%; a quebra do e-mail no cabeçalho foi ajustada. Isso não cobre manualmente todos os estados, labels, headings, microtextos e contrastes de todas as telas, nem substitui a inspeção integral de teclado.
- **T037**: validada por Playwright em mobile/desktop, incluindo movimento reduzido, indisponibilidade de fontes/imagens e ausência de rolagem horizontal nas jornadas cobertas.
- **T038 / SC-006**: pendente. Não foram medidas dez aberturas frias com rede limitada a 10 Mbps/150 ms; não declarar o objetivo de desempenho aceito.
- **T039 / SC-001 e SC-005**: pendente de sessão com cinco pessoas, incluindo pelo menos duas com 60 anos ou mais. Nenhum resultado humano foi inferido dos testes automatizados.

### Verificação automatizada observada

- `npm run test:unit`: aprovado — 19 arquivos, 64 testes.
- `npm run test:rules`: aprovado — 3 arquivos, 21 testes.
- `npx firebase emulators:exec --only auth,database "npm run test:e2e -- --workers=1 --reporter=line"`: aprovado — 25 testes, incluindo o novo teste de acessibilidade do organizador.
- `npm run build`: aprovado. Vite reportou chunk JavaScript maior que 500 kB (573,52 kB); a compilação terminou com sucesso.
- `git diff --check`: aprovado.
- O Firebase CLI avisou que as credenciais locais estavam expiradas; os emuladores iniciaram e as suítes terminaram normalmente. Nenhuma publicação foi feita.

### Registro final

- Os resultados automatizados, a revisão manual e a validação com usuários permanecem separados.
- A implementação e as suítes estão concluídas; os critérios de aceitação relacionados a desempenho, revisão manual de acessibilidade e sessões com usuários continuam pendentes até serem efetivamente medidos.
