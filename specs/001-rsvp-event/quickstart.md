# Guia de Validação: RSVP de Festa

Este guia usa os scripts e serviços já configurados no repositório. O ambiente local usa Firebase Authentication e Realtime Database Emulator com o projeto de demonstração `demo-taskify`.

## Pré-requisitos

- Node.js 24 LTS e npm (`nvm use` seleciona a versão registrada em `.nvmrc`).
- Firebase CLI (incluída nas dependências do projeto).
- Navegador Chromium para os fluxos Playwright; dispositivo com câmera para teste físico do QR Code.

## Desenvolvimento local

```sh
npm install
cp .env.example .env.local
firebase emulators:start --only auth,database
```

Em outro terminal, execute `npm run dev`. O `.env.example` contém valores de demonstração e aponta para os emuladores; não use essa configuração para produção.

## Verificações automatizadas

```sh
npm run test:unit
npm run test:rules
npx firebase emulators:exec --only auth,database "npm run test:e2e"
npm run build
```

`test:rules` inicia e encerra seus próprios emuladores. Os arquivos de Rules rodam sequencialmente porque compartilham e limpam a mesma base. O E2E inicia o servidor Vite via Playwright e precisa dos emuladores disponíveis. `npm run test` também executa as três suítes; inicie os emuladores antes de usá-lo.

## Cenários de validação

1. Criar anfitrião no emulador, autenticar e criar evento; verificar que o UID proprietário é persistido e não pode ser alterado.
2. Autenticar como segundo anfitrião; confirmar que não consegue ler nem alterar os dados privados do primeiro evento.
3. Acessar como convidado sem login; confirmar que somente conteúdo publicado está visível, que convidado não lê inbox/roster/mensagens/respostas de terceiros e que o link de edição autoriza somente a própria resposta.
4. Tentar submissões com estado inválido, campos extras, nome ausente, mensagem acima de 500 caracteres, evento inexistente ou não publicado e mutação de registros; todas devem ser negadas sem alterar respostas existentes.
5. Enviar RSVP sem login; confirmar que entra na inbox e é associado pelo cliente do anfitrião quando a gestão está aberta. Medir até cinco segundos com o anfitrião conectado; desconectar o anfitrião e confirmar retenção até a próxima abertura, sem SLA durante a desconexão.
6. Testar matching ignorando caixa, espaços externos/repetidos e formas Unicode canônicas, mas preservando acentos; validar nomes duplicados, exclusão manual de não correspondências, edição de nome voltando para revisão, reenvio público como novo registro e última gravação aceita em edições concorrentes pelo mesmo link.
7. Revogar o link de edição e confirmar que o token antigo falha; emitir outro para o mesmo RSVP, verificar o escopo individual e confirmar que não há expiração nem reenvio automático.
8. Publicar link/QR, ler o QR em celular e validar preparação da mensagem no WhatsApp e rascunho em cliente de e-mail, sem alegar envio automático.
9. Confirmar que endereço informado é codificado no link de direções e conferir manualmente o destino antes de publicar; se estiver incompleto ou não gerar rota útil, o texto continua visível. A foto opcional do espaço não pode ocultar o endereço/link quando ausente ou indisponível.
10. Testar URLs HTTPS inválidas/indisponíveis, fallback acessível e texto alternativo de fotos; confirmar que a página não depende da galeria e que o provedor recebe requisição diretamente do navegador.
11. Navegar por teclado pela página e formulários; confirmar ordem de foco, foco visível e nomes acessíveis em links e controles.
12. Cadastrar até 100 convidados e confirmar que o 101º é recusado com explicação. Simular falha de conexão/gravação e confirmar que o formulário é preservado e pode ser reenviado. O Spark limita 100 conexões simultâneas totais por instância, incluindo o anfitrião; teste no emulador não comprova quotas reais.
13. Confirmar RSVP com acompanhantes de nomes e idades válidos; verificar que cada pessoa soma um ao total confirmado, aparece sob o convidado principal e ganha linha própria no CSV. Testar idade vazia, decimal, fora de 0–120 e o 21º acompanhante; editar pelo link individual, remover acompanhantes e recusar presença, confirmando que a lista e os totais são atualizados.

## Deploy

Antes do deploy desta atualização, validar também:

- Cadastrar convidado com e sem telefone; editar e remover o número no painel. Confirmar que o RSVP público e o link de edição não expõem o telefone.
- Enviar RSVP com nome único e acompanhantes; trocar a associação automática para outro cadastro livre. Conferir que resposta e acompanhantes são transferidos, os totais não duplicam e o telefone usado no CSV é o do cadastro destino.
- Desfazer a associação, recarregar a gestão e editar o RSVP pelo link individual. Confirmar que permanece em revisão até a associação manual; verificar que outro RSVP não substitui uma associação marcada como manual.
- Baixar CSV e ler o conteúdo: uma linha para cada confirmado e acompanhante, telefone somente na linha do convidado principal, mantendo exportação dos registros antigos sem telefone.

Configure um projeto Firebase no Spark com Authentication por e-mail/senha e Realtime Database. Atualize `.env.local` com a configuração Web pública do projeto e `VITE_USE_FIREBASE_EMULATORS=false`; não publique valores de demonstração. Gere `dist/` com `npm run build` e publique Rules e Hosting com `firebase deploy --project SEU_PROJECT_ID --only database,hosting`. Não vincule billing nem habilite Maps API ou armazenamento de imagens para esta feature.

## Resultado e limites

As suítes automatizadas cobrem proprietário, outro UID, convidado anônimo, edição por token, roster, inbox e exportação. Nenhum teste de emulador comprova quotas reais do Spark. Confirmar também leitura física do QR, carregamento móvel e comportamento dos provedores externos antes de divulgar o evento.
