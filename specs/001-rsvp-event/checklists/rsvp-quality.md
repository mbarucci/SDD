# Checklist de Qualidade dos Requisitos: RSVP de Festa

**Purpose**: Revisar completude, clareza, consistência e cobertura dos requisitos de RSVP antes da decomposição em tarefas.
**Created**: 2026-10-05
**Feature**: [spec.md](../spec.md)

**Note**: Esta checklist customizada valida a qualidade do que está especificado; não verifica a implementação.
**Review Ownership**: Esta checklist pertence ao revisor dos requisitos. Marque um item `[x]` somente após concluir que o critério de qualidade está satisfeito.
**Marker Semantics**: `[x]` significa que a qualidade do requisito foi revisada e aprovada; não significa que a implementação foi concluída.

## Requirement Completeness

- [X] CHK001 O spec define criação da conta do anfitrião, autenticação, saída e recuperação de acesso quando as credenciais forem perdidas? [Gap, Spec §FR-001, §FR-015]
- [X] CHK002 Os requisitos definem limites e tratamento para envios anônimos repetidos, mensagens abusivas e tentativas inválidas? [Gap, Spec §FR-008, §FR-009]
- [X] CHK003 Está especificado quais dados de RSVP ainda não associados ficam na inbox, por quanto tempo são mantidos e como o anfitrião os resolve? [Completeness, Spec §FR-011, §FR-012]
- [X] CHK004 Os requisitos de privacidade distinguem explicitamente o que convidados anônimos podem ler do que podem submeter à inbox? [Gap, Spec §FR-012, §FR-015]
- [X] CHK005 Os requisitos de acessibilidade cobrem texto alternativo para fotos e imagem do local, foco de teclado e nomes acessíveis dos links? [Gap, Spec §FR-004, §FR-016]

## Requirement Clarity

- [X] CHK006 As regras de comparação de nomes especificam normalização de maiúsculas, espaços, acentos e caracteres equivalentes? [Ambiguity, Spec §FR-020]
- [X] CHK007 A diferença entre nome não encontrado, correspondência única e nomes duplicados está definida para o convidado e para o anfitrião? [Clarity, Spec §FR-020]
- [X] CHK008 O requisito esclarece se a imagem estática do local é obrigatória ou opcional de forma consistente entre fluxo, FR-016 e SC-007? [Conflict, Spec §Feature 3, §FR-016, §SC-007]
- [X] CHK009 Os requisitos definem quais URLs de imagem são aceitas e as expectativas de privacidade e disponibilidade do serviço externo? [Gap, Dependency, Spec §FR-004, §FR-016]
- [X] CHK010 O acesso privado de edição define expiração, revogação, reenvio e o escopo exato da resposta que o link autoriza? [Gap, Spec §FR-010]

## Requirement Consistency

- [X] CHK011 O prazo de cinco segundos para atualizar a gestão é compatível com a associação de respostas que só ocorre quando o anfitrião abre a área de gestão? [Conflict, Spec §FR-011, §SC-004; Plan §Submissões anônimas]
- [X] CHK012 O envio de mensagem sem alterar uma resposta existente é consistente com a associação de mensagens a uma resposta e com a inbox anônima? [Consistency, Spec §Feature 7, §FR-009; Data Model §Mensagem]
- [X] CHK013 Permitir que o convidado altere o nome durante a edição é consistente com a associação ao convidado cadastrado e com o tratamento de duplicatas? [Consistency, Spec §Feature 8, §FR-010, §FR-020]
- [X] CHK014 A autenticação exigida do anfitrião permanece claramente distinta da ausência de login exigida dos convidados em todas as jornadas e critérios? [Consistency, Spec §FR-001, §FR-008, §FR-015]

## Acceptance Criteria Quality

- [X] CHK015 O limite de até 100 convidados esclarece se representa pessoas cadastradas ou conexões simultâneas, e define o comportamento esperado ao atingir o limite do Spark? [Clarity, Gap, Plan §Contexto Técnico]
- [X] CHK016 O critério de atualização em cinco segundos define de qual evento até qual estado visível o intervalo é medido, inclusive quando o anfitrião está desconectado? [Measurability, Spec §SC-004]
- [X] CHK017 O critério da localização permite determinar objetivamente se o link aponta ao endereço informado e se a falha da imagem preserva as demais informações? [Measurability, Spec §FR-016, §SC-007]

## Scenario Coverage

- [X] CHK018 Os requisitos cobrem a inbox enquanto o anfitrião está desconectado, incluindo retorno à gestão, associação pendente e comunicação de falhas? [Coverage, Exception Flow, Plan §Submissões anônimas]
- [X] CHK019 Os requisitos definem o resultado para RSVP concorrentes, reenvios e edição simultânea da mesma resposta? [Gap, Edge Case, Spec §FR-010, §FR-020]
- [X] CHK020 Os requisitos especificam o risco residual de outra pessoa responder pelo convidado e quais dados ou ações ficam acessíveis por um link de edição compartilhado? [Assumption, Gap, Spec §Assumptions, §FR-010]

## Dependencies & Assumptions

- [X] CHK021 A dependência de imagens públicas externas identifica quem fornece a imagem do local e mantém explícito que o provedor e seus custos ainda não foram escolhidos? [Dependency, Assumption, Spec §Assumptions]
- [X] CHK022 O uso de endereço e Google Maps URL, sem mapa incorporado ou Maps API, está consistente entre requisitos, critérios de sucesso e plano? [Consistency, Spec §FR-016, §SC-007; Plan §Mapas]

## Location Requirement Follow-Up

- [X] CHK023 A especificação esclarece se “imagem estática do local” significa uma foto do espaço ou uma imagem cartográfica estática? [Ambiguity, Spec §Feature 3, §FR-016]
- [X] CHK024 Os requisitos definem o que acontece quando o endereço está incompleto ou não gera direções úteis, além do caso de falha da imagem? [Gap, Edge Case, Spec §Feature 3, §FR-016]

## Notes

- Os itens foram gerados para revisão do autor antes da criação de `tasks.md`; todos começam desmarcados.
- Marque `[x]` somente após revisar e aprovar a qualidade do requisito correspondente.
- Esta checklist customizada é separada de `checklists/requirements.md`, mantida pelo Spec Kit.
- `/speckit-implement` lê estados de checklist como gate e não deve alterar seus marcadores.
