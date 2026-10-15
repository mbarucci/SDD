# Contratos da interface e compatibilidade

**Referências**: [spec.md](../spec.md), [modelo](../data-model.md), [contrato de dados existente](../../001-rsvp-event/contracts/realtime-database.md).

## 1. Navegação

| Entrada | Comportamento |
|---------|---------------|
| `/event/{eventId}` | Convite publicado sem login; não ler roster, telefone ou conta do anfitrião |
| `/edit/{token}` | Acesso privado à resposta existente; inválido/revogado não expõe os campos |
| `/host` e entrada administrativa atual | Preservar resolução existente em `App.jsx` e fluxo de autenticação |
| Evento selecionado | Estado local: `event`, `guests`, `messages`, `share`, `export`; nenhuma rota nova |

Ordem exata da navegação: Evento | Convidados | Mensagens | Compartilhar | Exportar confirmados. Ordem de implementação após aprovação: Meus eventos → Evento → Convidados → Compartilhar → Mensagens → Exportar. São ordens distintas, não conflitantes.

Manter âncoras públicas `#about`, `#photos`, `#rsvp` e `#guest-message` quando seus conteúdos forem apresentados. `#rsvp` permanece após sucesso; prévia usa IDs exclusivos para não desviar foco da página real.

## 2. Dados e operações

- Novo RSVP continua chamando `submitRsvp({ eventId, name, decision, message, companions })`.
- Editar continua chamando `saveEditCapability(capability, fields)` e mantém o `submissionId`.
- Valores persistidos não mudam com os textos: “Vou” → `confirmed`; “Não posso” → `declined`.
- Acompanhantes mantêm `{ name, age }`; recusa conserva o comportamento atual de envio/retorno de acompanhantes. Não acrescentar comportamento próprio na camada visual.
- Autenticação, cadastro/importação/edição/exclusão/mesclagem, associação e revogação usam os mesmos serviços e guardas.
- Prévia recebe rascunho do editor, não chama Firebase e não salva nada.
- Preservar a semântica de salvar rascunho/publicar existente; reorganização não pode silenciosamente mudar a transição realizada por `saveEvent`.
- Rules e schema não são alterados por este redesign.

## 3. Componentes compartilhados

### `EventInvitation`

Recebe `event`, identificação de modo público/prévia e prefixo de IDs quando necessário. Renderiza apenas conteúdo e links permitidos; não controla sessão, não busca dados e não inclui formulário persistente. Reutiliza galeria/localização existentes com ajustes de apresentação.

No modo público, mapa continua sendo link HTTPS externo seguro e a resposta aponta para `#rsvp`. No modo prévia, informar que interações são ilustrativas e impedir submissão/navegação acidental.

### `RsvpFields`

Recebe valores controlados de nome, decisão, acompanhantes e mensagem; callbacks de alteração; `idPrefix` e `disabled` durante salvamento. Renderiza labels/radios reais, contador de mensagem e CompanionFields. Não gera token nem chama serviços.

Cada página continua responsável por submit, erros, sucesso e resumo persistido. A edição não lê eventos privados para montar o formulário.

### `CopyLinkControl`

Recebe URL e rótulo contextual. Em ação explícita, copia URL absoluta; anuncia sucesso somente após conclusão. Falha mostra URL selecionável e instrução manual com feedback acessível. Não coloca token em logs, analytics ou mensagens de compartilhamento público.

### `ConfirmedExport`

Recebe roster completo carregado do evento e estados de carga/erro. Usa `confirmedParticipants` para prévia e `downloadConfirmedGuests` para arquivo. Não mantém outra versão de lista nem serializador.

## 4. Microtextos e interação

- Saudação: “Você está convidado”; não simular nome de anfitrião indisponível.
- Radios: “Vou” / “Não posso”; nome do grupo informa pergunta de presença.
- Envio: “Confirmar presença” para confirmação, “Confirmar resposta” para recusa; ocupado: texto de gravação e controles desabilitados.
- Edição: “Salvar resposta”; resumo da resposta salva e dia em pt-BR.
- Sucesso: confirmação de resposta sem afirmar que a pessoa recusada comparecerá. Destacar “Editar minha resposta” e explicação para guardar/copy.
- Recados e detalhes privados somente na gestão.
- Erros indicam ação possível; não exibir “cancelado”, “expirado” ou “lotado” sem estado real correspondente.
- Estados de lista: carregando, erro, vazia e sem resultados filtrados distintos.

## 5. Acessibilidade e layout

- Um título principal por página, hierarquia de headings, labels associados e `role=status`/`role=alert` usados sem anúncios duplicados.
- Foco visível em todos os controles; radios operáveis por teclado e estado marcado nativo, nunca botões decorativos sem semântica.
- No painel, usar botões com `aria-current` como navegação de seções ou implementar integralmente o padrão ARIA tabs; não usar papéis de tabs sem teclado correspondente. Preferir o padrão de navegação existente.
- Base ≥18px; links/botões ≥44px, escolhas RSVP ≥48px. Labels podem envolver linhas, nunca cortar nome/dado essencial.
- Testar 375/768/1280 e texto/zoom 200%. Abas podem rolar localmente, página não.
- CTA fixa tem espaço reservado/safe-area e não permanece sobre formulário ativo ou confirmação.
- Foco vai ao resultado de envio/erro de validação apropriado; âncoras não deixam o usuário de teclado no CTA anterior.
- Movimento reduzido elimina animação decorativa e scroll suave; duração normal ≤250ms.
- Capa e galeria têm alternativas, espaço reservado e fallback sem bloqueio do RSVP.

## 6. Dados administrativos consistentes

- Não reutilizar roster de outro evento nem habilitar exportação até carga do evento atual.
- Resumos e cabeçalho usam a mesma projeção canônica da gestão, não valores do filtro ou números inventados.
- Se precisar ampliar o callback de `listenToEventManagement`, preservar `guests`, `inactiveGuests`, `submissions` e `error`; acrescentar estado de prontidão sem mudar os registros. Encerrar listeners ao desmontar/trocar contexto.
- Reutilizar reconciliação existente e aguardar snapshots necessários; não sincronizar coleção vazia provisória como se fosse carga concluída.
- Falha ao carregar resumo de um evento deve ser visível no respectivo item e permitir recuperação, sem esconder outros eventos.

## 7. CSV

Nome padrão `convidados-confirmados.csv`; UTF-8 com BOM, separador vírgula, linhas CRLF e escaping existente. Colunas, nesta ordem:

1. Nome
2. Idade
3. Telefone
4. Convidado principal
5. Situação
6. Data da última resposta

Uma linha por participante projetado, sem incluir inativos e sem duplicar acompanhante espelho. Prévia mostra esses mesmos dados com apresentação legível; timestamp no arquivo mantém o formato existente.

## 8. Gate de entrega

Antes de editar a UI, apresentar tokens e arquivos previstos ao usuário. Implementar apenas público/criação/edição e infraestrutura compartilhada estritamente necessária. Demonstrar resultado e aguardar resposta explícita de aprovação; não assumir aprovação por testes verdes ou por continuar gerando tarefas.

Sem aprovação, tarefas administrativas permanecem bloqueadas. Depois dela, aplicar ordem de implementação definida, com testes por incremento. Publicação requer pedido separado.
