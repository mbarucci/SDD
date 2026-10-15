# Pesquisa: usabilidade e identidade visual

**Data**: 2026-10-15
**Base**: [spec.md](./spec.md), inspeção do código atual e ferramentas instaladas. Pesquisa concluída para o planejamento; não representa implementação nem validação de usabilidade.

## 1. Preservação da plataforma

**Decisão**: Manter React/Vite/Tailwind/Firebase e componentes próprios; não instalar shadcn/ui ou biblioteca de animação.

**Racional**: `package.json` não inclui shadcn/ui. O layout existente já usa classes CSS e componentes de feature; trocar a base adicionaria migração sem benefício necessário.

**Alternativas consideradas**: Nova biblioteca de componentes ou reescrita do painel; rejeitadas por ampliar escopo e risco. O cenário descrito de roxo/Inter não corresponde ao código atual, que usa Georgia/Arial e verde/coral.

## 2. Direção visual e contraste

**Decisão inicial**: Creme `#F8F3EA`, superfície `#FFFCF6`, marrom `#3F2E26`, secundário `#6F5B50` e terracota `#A3472F`.

Em 15/10/2026, o usuário forneceu uma paleta de lavanda/azul pastel para substituir a direção cromática inicial: `#DFC5FF`, `#BCB3E8`, `#D2D6FF`, `#B3C6E8` e `#C5E9FF`. A implementação usa essas cores em superfícies, destaque de capa, seleção e divisórias, mantendo tons escuros derivados para ação/texto e cores distintas para status RSVP.

**Racional**: manter a paleta suave sem usar tons pastel para texto pequeno ou CTA com texto branco. Os seguintes contrastes foram calculados com luminância relativa sRGB e fórmula WCAG:

| Primeiro plano | Fundo | Razão |
|----------------|-------|-------|
| `#29243D` | `#F8F7FC` | 13,93:1 |
| `#514B68` | `#F8F7FC` | 7,71:1 |
| `#FFFFFF` | `#5B4B86` | 7,51:1 |
| `#FFFFFF` | `#483966` (hover) | 10,23:1 |
| `#285D45` | `#FFFFFF` | 7,66:1 |
| `#943D3D` | `#FFFFFF` | 7,01:1 |
| `#5D6073` | `#FFFFFF` | 6,20:1 |
| `#7B7795` | `#FFFFFF` | 4,27:1 |
| `#365B91` | `#F8F7FC` | 6,43:1 |
| `#29243D` | `#DFC5FF` | 9,60:1 |
| `#29243D` | `#C5E9FF` | 11,65:1 |

A borda é cor de controle, não de texto. Combinações hover/selecionado/foco devem ser medidas na implementação; estes resultados não comprovam AA da interface inteira.

**Alternativas consideradas**: usar diretamente os pastéis como cor de texto/CTA foi rejeitado por baixo contraste. Gradientes, extração de cor por imagem e seleção persistida de cor continuam fora de escopo.

## 3. Tipografia e privacidade

**Decisão**: Fraunces nos títulos e DM Sans no corpo, WOFF2 locais com cobertura pt-BR e pesos restritos ao uso; fallback Georgia/system-ui. Verificar e incluir licenças redistribuíveis dos arquivos efetivamente obtidos antes de adicioná-los.

**Racional**: Atende à direção solicitada sem enviar IP/metadados a um serviço de fontes durante a visita. `font-display: swap` mantém conteúdo utilizável na falha de carregamento.

**Alternativas consideradas**: Fontes remotas adicionam requisições externas e dependência de rede; rejeitadas. Só usar fontes de sistema não entrega a direção aprovada. Não adicionar pacote npm apenas para fontes.

## 4. Apresentação pública compartilhada

**Decisão**: Extrair apresentação pura `EventInvitation` de `PublicEventPage` e reutilizá-la na prévia administrativa. Preservar precedência da imagem do local/primeira foto, endereço, mapa e avisos existentes sobre imagens externas.

**Racional**: O público atual já usa `Object.values(event.photos ?? {})`, aceita imagem HTTPS e tem fallback. A prévia deve usar os mesmos dados e componentes, sem buscar, salvar ou submeter RSVP.

**Alternativas consideradas**: Segunda árvore visual da prévia diverge com o tempo; iframe exigiria persistência para refletir rascunho. Ambas rejeitadas.

Imagens de capa: dimensões/aspect-ratio reservadas, carregamento prioritário apenas da imagem acima da dobra; galeria lazy. Não prometer comprimir imagens remotas que não controlamos, nem criar proxy/upload.

## 5. CTA móvel e acessibilidade

**Decisão**: Ação fixa apenas fora do formulário/resultado, com safe-area e espaço reservado, visibilidade por IntersectionObserver e ocultação ao foco em campos. Manter navegação por âncora e foco gerenciado.

**Racional**: Uma barra sempre fixa sobre teclado virtual ou submit prejudica pessoas idosas e navegação por teclado. Redução de movimento desativa scroll/transições animadas. Sem suporte ao observador, manter uma ação de fluxo normal utilizável, não uma barra que sobreponha controles.

**Alternativas consideradas**: Barra fixa permanente e scroll automático sem foco foram rejeitados por ocultar conteúdo e perder contexto.

## 6. RSVP e links existentes

**Decisão**: Compartilhar campos, sem mover lógica de persistência para componente visual. Manter `confirmed`/`declined`, `normalizeCompanions`, limite de 20 e dados privados existentes. Serviços de envio/edição permanecem intactos.

**Racional**: Criar e editar atualmente duplicam o formulário, mas têm operações distintas. Alterar rótulos não deve alterar payload nem transformar edição em novo envio.

`updatedAt` informa a última atualização persistida, não uma data de intenção ainda não salva; exibi-lo como data da resposta existente, reconhecendo que operações administrativas existentes também podem atualizá-lo. Não inventar histórico ou timestamp novo.

**Alternativas consideradas**: Terceiro status, contadores adultos/crianças e novas capacidades foram explicitamente adiados. Copiar link privado é ação deliberada do usuário; compartilhar convite deve usar apenas `/event/{eventId}`.

## 7. Organização administrativa e consistência dos dados

**Decisão**: Manter estado de aba local e rotas existentes. Reutilizar o listener de gestão e a reconciliação existente, garantindo carga/prontidão por evento antes de projetar totais, mensagens ou CSV.

**Racional**: `HostDashboard` hoje só assina gestão nas abas `guests`/`messages`; exportar de outra aba pode usar estado não carregado ou de outro evento. O novo cabeçalho e a prévia exigem que carregamento/erro sejam explícitos, com limpeza ao trocar evento e cleanup dos listeners. Não persistir resumos novos.

Na lista de eventos, resumos devem utilizar snapshots carregados e o mesmo ciclo de sincronização, com uma assinatura por evento exibido e encerramento ao sair. Não implementar outro algoritmo para associação de nomes nem reconciliar dados parciais.

**Alternativas consideradas**: Gravar totais em `hostEventIndex` exigiria alterações de dados/consistência fora do escopo. Mostrar zero antes da carga ou contar inbox sem associação produziria resultados errados.

## 8. Prévia, busca e exportação

**Decisão**: Filtrar apenas a apresentação, preservando roster completo para operações/totais. Usar `confirmedParticipants` na prévia e `downloadConfirmedGuests` no download.

**Racional**: `participantList.js` já deduplica nome normalizado + idade e `exportConfirmedGuests.js` inclui BOM, seis colunas e participantes vinculados. A nova seção não deve inventar quantidades nem alterar CSV.

**Alternativas consideradas**: Filtrar os dados-base do dashboard ou reimplementar a serialização causaria divergência e regressão.

## 9. Estilos progressivos e aprovação

**Decisão**: Uma fonte de tokens; introdução pública inicialmente isolada, reaproveitada no organizador somente após aprovação explícita.

**Racional**: `src/index.css` contém regras globais, inclusive famílias e medidas repetidas; trocar tudo de uma vez violaria o gate de entrega. A consolidação deve remover duplicações somente das superfícies já entregues.

**Alternativas consideradas**: Refatoração integral do CSS antes da demonstração, sistema genérico de temas e componentes universais foram rejeitados por ampliar risco.

## 10. Verificação

**Decisão**: Testes existentes + novos testes focados de componentes e Playwright, cálculos de contraste e revisão manual, sem dependência adicional de auditoria.

**Racional**: Existem Vitest, Testing Library, Playwright e testes de regras; mudança de textos exige atualizar seletores sem enfraquecer asserts. Emuladores de Rules e E2E usam as mesmas portas e devem rodar em sequência, não simultaneamente.

**Alternativas consideradas**: Snapshots visuais como única prova não verificam foco, payload ou contagens. Somente testes automatizados não comprovam satisfação, facilidade de uso nem conformidade completa.

Todos os pontos de pesquisa têm decisão. Aquisição/licenciamento dos arquivos de fonte, medições em produção e aprovação visual são etapas verificáveis da execução, não dúvidas de escopo pendentes.
