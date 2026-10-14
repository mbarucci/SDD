# Taskify RSVP de Festa

Aplicação web de RSVP com eventos públicos, respostas anônimas e gestão privada pelo anfitrião. A aplicação usa Firebase Authentication e Realtime Database; fotos são URLs HTTPS externas e o link de direções usa uma URL do Google Maps, sem Maps API.

## Desenvolvimento local

Requisitos: Node.js 24 LTS, npm e Firebase CLI. Use `nvm use` para selecionar a versão registrada em `.nvmrc`.

```sh
npm install
cp .env.example .env.local
firebase emulators:start --only auth,database
```

Em outro terminal, inicie a aplicação:

```sh
npm run dev
```

O `.env.example` usa valores de demonstração e ativa os emuladores locais. Não use esses valores para publicação.

## Validação

```sh
npm run test:unit
npm run test:rules
npx firebase emulators:exec --only auth,database "npm run test:e2e"
npm run build
```

`npm run test:rules` inicia os próprios emuladores e executa os arquivos de Rules serialmente, pois eles limpam a mesma base. O E2E e o servidor local precisam dos emuladores em execução.

## Firebase Hosting no plano Spark

1. Crie um projeto Firebase no plano Spark, habilite o provedor de e-mail/senha no Authentication e crie um Realtime Database. Não vincule uma conta de faturamento.
2. Copie a configuração Web pública do projeto para `.env.local` (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_DATABASE_URL`, `VITE_FIREBASE_PROJECT_ID` e `VITE_FIREBASE_APP_ID`) e defina `VITE_USE_FIREBASE_EMULATORS=false`.
3. Faça login na Firebase CLI e publique apontando explicitamente para o projeto:

```sh
firebase login
npm run build
firebase deploy --project SEU_PROJECT_ID --only database,hosting
```

O `firebase.json` publica `dist/` e redireciona rotas da aplicação para `index.html`. Revise as Security Rules e os limites de conexões do Spark antes de divulgar o evento. A validação no emulador não comprova quotas reais de produção.

Não configure Cloud Functions, Maps API, uploads de imagens ou outro serviço que exija billing para este fluxo. Imagens HTTPS externas são carregadas diretamente pelo navegador do convidado; o provedor pode receber IP e metadados da requisição. Revise o destino do link de direções antes de publicar.

Mais cenários e critérios estão em [specs/001-rsvp-event/quickstart.md](specs/001-rsvp-event/quickstart.md).