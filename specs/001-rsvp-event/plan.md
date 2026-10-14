# Plano de Implementação: RSVP de Festa

**Branch**: `001-rsvp-event` | **Data**: 2026-10-05 | **Spec**: [spec.md](spec.md)

**Status**: Plano de design concluído; implementação depende da validação das Security Rules e da escolha de provedores sem custo adicional.

## Resumo

Aplicação web responsiva de RSVP. O anfitrião usa Firebase Authentication para criar e gerir eventos; convidados consultam o conteúdo publicado e enviam RSVP sem login. A proposta usa React/Vite, Firebase Web SDK e Realtime Database no Spark, sem Cloud Functions ou API própria. Submissões anônimas ficam numa caixa de entrada privada ao anfitrião, que as associa ao cadastro de convidados. Um RSVP confirmado pode incluir até 20 acompanhantes, que permanecem vinculados à resposta e contam individualmente na lista e na exportação. Fotos da galeria e foto opcional do espaço são URLs HTTPS externas fornecidas pelo anfitrião, sem provedor escolhido. O endereço tem um link de direções do Google Maps, sem API ou billing.

## Contexto Técnico

**Linguagem/Versão**: JavaScript moderno; fixar versão LTS do Node.js durante o bootstrap.

**Dependências principais**: React, Vite, Tailwind CSS, Firebase Web SDK, biblioteca client-side de QR Code a selecionar após revisão de manutenção e dependências.

**Armazenamento**: Firebase Realtime Database no plano Spark; URLs públicas de imagens externas. Não armazenar arquivos de imagem no Firebase.

**Testes**: Firebase Local Emulator Suite (Authentication e Realtime Database), testes automatizados de Security Rules, testes unitários e Playwright para fluxos no navegador.

**Plataforma-alvo**: Navegadores móveis e desktop; hosting estático, com Firebase Hosting como preferência inicial sujeita à comparação com Vercel/Netlify.

**Tipo de projeto**: Aplicação web client-side, sem backend/API própria.

**Metas de desempenho**: RSVP completável em até um minuto; com gestão aberta e anfitrião conectado, submissões aceitas ficam visíveis em até cinco segundos; layout sem rolagem horizontal. Nenhum polling ou serviço de processamento em segundo plano será adicionado.

**Restrições**: Só o anfitrião se autentica. Dados privados são protegidos por UID proprietário. Convidados podem criar submissões anônimas limitadas, mas não ler inbox, lista ou mensagens; o link de edição dá acesso somente à própria resposta. Sem Cloud Functions, tarefas agendadas, polling adicional ou obrigação de billing. App Check não é requisito e não prova identidade nem fornece rate limiting por pessoa. A localização usa uma foto externa opcional e Google Maps URL, sem Maps API. O Spark permite 100 conexões simultâneas totais por instância, incluindo sessões do anfitrião.

**Escala/Escopo**: Um evento e até 100 convidados cadastrados; esse número não representa simultaneidade. O limite Spark é 100 conexões simultâneas totais por instância, incluindo anfitriões; não há garantia de que todos os convidados possam estar conectados ao mesmo tempo. Falhas de conexão/gravação devem ser recuperáveis e preservar o formulário para nova tentativa.

## Verificação da Constituição

| Gate | Estado | Evidência |
| --- | --- | --- |
| Especificação antes da implementação | PASS | [spec.md](spec.md) define jornadas, FRs e critérios mensuráveis. |
| Rastreabilidade | PASS | Modelo, contrato e guia apontam para entidades e requisitos da feature. |
| Resultados verificáveis | PASS | [quickstart.md](quickstart.md) define cenários em emuladores e navegador. |
| Mudanças pequenas e reversíveis | PASS | Cliente web único e SDK oficial, sem serviço backend próprio. |
| Segurança e privacidade por padrão | CONDITIONAL | Inbox anônima isolada é proposta; Rules e capacidades de edição ainda precisam passar testes no Emulator Suite. Identidade do convidado não é comprovada. |
| Compatibilidade com custo pretendido | PASS | FR-016 usa endereço, foto externa opcional e Google Maps URL; nenhuma Maps API ou faturamento adicional é necessário. |

**Gate para implementação**: validar Rules de proprietário, leitura pública, submissões anônimas, inbox e edição por link no Emulator Suite. O desenho de inbox elimina a necessidade de revelar o roster, mas não impede spam ou que alguém responda por outra pessoa.

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

**Decisão de estrutura**: uma aplicação React/Vite. A UI é organizada por fluxo; serviços Firebase ficam isolados; Rules e fluxos e2e têm suítes próprias. A árvore é proposta porque o repositório ainda não contém scaffold de aplicação.

## Decisões Técnicas

### Submissões anônimas

Separar `publicEvents` do caminho privado `privateEvents`. Convidados leem somente conteúdo publicado e podem criar um novo registro em `privateEvents/{eventId}/inbox/{submissionId}` sem ler o ancestral; não podem ler roster, inbox, mensagens privadas ou respostas alheias. Security Rules validam formato, tamanho máximo de 500 caracteres para mensagens, decisão permitida, nome presente, evento publicado e criação somente; leitura da inbox exige UID proprietário. A inbox mantém nome informado, decisão, mensagem opcional, acompanhantes (somente em RSVP confirmado, máximo de 20, cada um com nome e idade inteira entre 0 e 120), data e estado até associação ou exclusão manual, sem expiração automática. Após associação, acompanhantes são projetados no roster privado sob o convidado principal, contam como participantes confirmados individuais e são exportados em linhas próprias; a edição usa o mesmo token do RSVP e recusar presença os remove. O cliente autenticado do anfitrião observa a inbox somente com a gestão aberta e compara nomes com o roster privado: correspondência única associa automaticamente, nomes duplicados aguardam resolução manual e envios sem correspondência podem ser excluídos pelo anfitrião. O prazo de cinco segundos aplica-se após gravação aceita quando o anfitrião está conectado e com a gestão aberta; submissões recebidas offline ficam na inbox e aparecem na próxima abertura, sem SLA durante a desconexão. Como gravações são anônimas, não há limite confiável por pessoa nem moderação automática; permanecem riscos de spam, exaustão de quotas, conteúdo abusivo e RSVP por outra pessoa.

### Edição por link

Usar capacidade aleatória de alta entropia por RSVP como segredo bearer. Cada token autoriza somente leitura e edição da resposta correspondente; não expira automaticamente. O anfitrião pode revogar o token e emitir outro, invalidando o anterior; não há reenvio automatizado, e o convidado solicita novo acesso ao anfitrião. Não permitir token para listar inbox/roster ou ler outros RSVP. Evitar incluir o token em analytics e links de terceiros; validar Rules de leitura, edição e revogação no emulador antes de liberar implementação. Edições concorrentes pela mesma capacidade usam a última gravação aceita.

### Mapas

Exibir o endereço e, opcionalmente, uma foto HTTPS externa do espaço, não uma imagem cartográfica. Construir o link de direções codificando o endereço informado em uma Google Maps URL; o anfitrião revisa o destino antes de publicar. Sem API de geocodificação, não validar rota nem endereço por requisição externa; se a rota não for útil, o texto do endereço continua disponível. Não usar Maps Embed, Maps JavaScript ou Static Maps APIs, nem vincular billing. O anfitrião fornece as URLs de imagem; provedor e custos continuam sem escolha.

### Autenticação e hosting

Autenticar apenas anfitrião com e-mail e senha no Firebase Auth; permitir criação de conta, entrada, saída e solicitação de redefinição de senha por e-mail. Não usar SMS sob a restrição de custo. Firebase Hosting é preferência inicial; validar domínio, redirects de Auth, cache de hosting e limites de transferência no Spark antes do deploy.

## Complexidade

Sem backend adicional. A inbox separada evita dar leitura pública à lista e mantém o modelo client-side, mas depende de regras estreitas e teste automatizado. A autenticação do anfitrião não autentica convidados; limites de formato e App Check não eliminam abuso anônimo.

## Pendências de Liberação

1. Validar no Emulator Suite isolamento entre anfitriões, leitura pública limitada, gravação anônima, revogação e escopo individual do link de edição.
2. Confirmar hosting e provedor externo de imagens antes do deploy, sem adotar serviço que exija pagamento para os limites pretendidos.
3. Exercitar falhas no limite de conexões/gravações e confirmar que o formulário preserva dados para nova tentativa; o Emulator Suite não comprova quotas reais do Spark.
4. Verificar os fluxos de mensagem associada, renomeação com nova revisão, conflitos de edição e carregamento acessível das imagens.

## Artefatos

- Pesquisa e fontes: [research.md](research.md)
- Entidades e caminhos propostos: [data-model.md](data-model.md)
- Invariantes de autorização: [contracts/realtime-database.md](contracts/realtime-database.md)
- Cenários de validação: [quickstart.md](quickstart.md)
