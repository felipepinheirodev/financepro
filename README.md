# FinancePro

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111827)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?logo=postgresql&logoColor=white)
![AI](https://img.shields.io/badge/IA-Groq%20%2B%20Qwen%20%2B%20OpenAI%20%2B%20Gemini-7C3AED)

FinancePro é um sistema de gestão financeira pessoal com frontend em React e backend em Node.js/Express, usando Prisma e PostgreSQL. O projeto organiza o frontend em camadas (`domain`, `application`, `infrastructure` e `presentation`) e possui módulos para finanças pessoais e controle de estoque/produção 3D.

O objetivo do projeto é demonstrar uma aplicação real com arquitetura em camadas, IA multi-provider, métricas de consumo de tokens e um módulo operacional de impressão 3D, pronta para ser estudada, apresentada e evoluída.

## Destaques

- Camada de IA multi-provider com Groq, Alibaba/Qwen, OpenAI/ChatGPT API e Google Gemini API.
- Roteamento de provider/modelo por tarefa.
- Tela de configuração de IA com consumo de tokens, histórico local e status de chaves.
- Dados fictícios gerados por seed para screenshots e demonstrações.
- Backend com validação Zod, Helmet, rate limit e CORS configurável.
- Frontend modular com separação entre domínio, aplicação, infraestrutura e apresentação.

## Funcionalidades

- Dashboard com visão de saldo, receitas, despesas e resultado do mês.
- Gestão de transações, contas bancárias, cartões de crédito e categorias.
- Contas a pagar, receitas e relatórios gráficos.
- Importação de transações via CSV/OFX/PDF/imagem com apoio de IA.
- Configuração de IA por provider/modelo, com medição local de consumo de tokens.
- Cofre de senhas local criptografado.
- Suporte a parcelamentos e templates recorrentes.
- Estoque 3D com filamentos, compras, movimentações, fornecedores, impressoras, acessórios e jobs de produção.

## Tecnologias

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Lucide React
- Recharts
- Date-fns
- Vite PWA

### Backend

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- Zod para validação de payloads
- Helmet para headers básicos de segurança
- Express Rate Limit para limitação de chamadas
- Integração multi-provider de IA: Groq, Alibaba/Qwen, OpenAI/ChatGPT API e Google Gemini API via Chat Completions/OpenAI-compatible APIs

## Configuração Local

### Pré-requisitos

- Node.js compatível com as versões usadas pelo projeto.
- npm.
- PostgreSQL local ou Docker Desktop, caso queira usar o banco via `docker-compose`.

### Instalação

Instale as dependências da raiz e do backend:

```bash
npm install
npm install --prefix server
```

### Variáveis de Ambiente

Copie os exemplos e ajuste os valores reais:

```bash
copy .env.example .env
copy server\.env.example server\.env
```

No PowerShell, se preferir:

```powershell
Copy-Item .env.example .env
Copy-Item server\.env.example server\.env
```

Arquivos `.env` reais ficam ignorados pelo Git. Não publique chaves, senhas ou URLs reais de banco.

Variáveis principais:

- `DATABASE_URL`: conexão PostgreSQL usada pelo Prisma.
- `GROQ_API_KEY`: chave Groq usada pelo backend para chamadas de IA.
- `GROQ_BASE_URL`: endpoint compatível com OpenAI para Groq.
- `GROQ_MODEL` e `GROQ_VISION_MODEL`: modelos Groq padrão.
- `ALIBABA_API_KEY`: chave Alibaba Cloud Model Studio / Qwen usada pelo backend.
- `ALIBABA_BASE_URL`: endpoint Alibaba/Qwen compatível com OpenAI.
- `ALIBABA_MODEL` e `ALIBABA_VISION_MODEL`: modelos Alibaba/Qwen padrão.
- `OPENAI_API_KEY`: chave da OpenAI usada para ChatGPT API.
- `OPENAI_BASE_URL`: endpoint da OpenAI. O padrão é `https://api.openai.com/v1`.
- `OPENAI_MODEL` e `OPENAI_VISION_MODEL`: modelos OpenAI padrão.
- `GOOGLE_GEMINI_API_KEY`: chave da Google Gemini API.
- `GOOGLE_GEMINI_BASE_URL`: endpoint OpenAI-compatible do Gemini.
- `GOOGLE_GEMINI_MODEL` e `GOOGLE_GEMINI_VISION_MODEL`: modelos Gemini padrão.
- `AI_PROVIDER_DEFAULT`: provider padrão (`groq`, `alibaba`, `openai` ou `google`).
- `AI_PROVIDER_INSIGHTS`: provider para insights financeiros.
- `AI_PROVIDER_EXTRACTION`: provider para extração de extratos/imagens.
- `AI_PROVIDER_CATEGORIZATION`: provider para categorização.
- `AI_PROVIDER_CLASSIFICATION`: provider para classificação fixa/variável.
- `ALLOWED_ORIGINS`: origens permitidas pelo CORS, separadas por vírgula.
- `HOST`: host do backend. O padrão recomendado local é `127.0.0.1`.
- `PORT`: porta do backend.
- `JSON_BODY_LIMIT`: limite de payload JSON.
- `RATE_LIMIT_PER_MINUTE`: limite opcional de chamadas por minuto.
- `ENERGY_TARIFF_KWH`: tarifa usada no cálculo de custo de produção 3D.

## Banco de Dados

### Opção 1: PostgreSQL via Docker

Abra o Docker Desktop antes de rodar os comandos abaixo.

```bash
npm run docker:up
```

O compose sobe um PostgreSQL em `localhost:5433`. As credenciais padrão vêm de `.env` ou dos fallbacks do `docker-compose.yml`.

Depois aplique as migrations versionadas:

```bash
npm run db:deploy
```

### Opção 2: PostgreSQL Local

Configure um PostgreSQL local e ajuste `DATABASE_URL` em `.env` e `server/.env`.

Depois aplique as migrations versionadas:

```bash
npm run db:deploy
```

Em desenvolvimento, se alterar o `schema.prisma`, gere uma nova migration:

```bash
npm run db:migrate
```

Use `npm run db:push` apenas para prototipagem local rápida. Para colaboração e uso por terceiros, prefira migrations versionadas.

## Rodando o Projeto

Para rodar frontend e backend sem tentar iniciar Docker automaticamente:

```bash
npm run dev
```

Para subir o PostgreSQL via Docker e depois rodar frontend + backend:

```bash
npm run dev:docker
```

Serviços locais:

- Frontend: `http://localhost:5173`
- Backend: `http://127.0.0.1:3000` por padrão
- PostgreSQL Docker: `localhost:5433`

Se `npm run dev:docker` falhar com erro de pipe do Docker, o Docker Desktop não está rodando.

## Dados Fictícios para Demonstração

Para gerar uma base fictícia com transações, contas, cartões, estoque 3D, impressoras, jobs e produtos demo:

```bash
npm run seed:demo
```

Esse comando limpa os dados atuais das tabelas do projeto e cria uma base nova para screenshots, testes locais e apresentação do repositório. Use apenas em ambiente local ou em um banco descartável.

Se o banco ainda não tiver as tabelas, aplique as migrations antes:

```bash
npm run db:deploy
npm run seed:demo
```

## IA Multi-Provider

O backend possui uma camada local de IA que permite rotear cada tarefa para um provider/modelo diferente. Hoje os providers suportados são:

- `groq`
- `alibaba`
- `openai`
- `google`

As chamadas usam o formato Chat Completions/OpenAI-compatible. Endpoints padrão:

```text
Groq: https://api.groq.com/openai/v1
Alibaba/Qwen: https://dashscope-intl.aliyuncs.com/compatible-mode/v1
OpenAI: https://api.openai.com/v1
Google Gemini: https://generativelanguage.googleapis.com/v1beta/openai
```

No Alibaba Cloud Model Studio, use o endpoint compatível, por exemplo:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

No Google Gemini, use o endpoint OpenAI-compatible:

```text
https://generativelanguage.googleapis.com/v1beta/openai/
```

### Tarefas Configuráveis

Cada tarefa pode usar provider, modelo, temperatura e limite de tokens próprios:

- `insights`: análise financeira e sugestões.
- `extraction`: extração de transações a partir de texto, PDF ou imagem.
- `categorization`: escolha automática de categoria.
- `classification`: classificação entre despesa fixa e variável.

### Tela de Configuração

Acesse:

```text
Configurações > IA
```

Nessa tela é possível:

- Ver quais providers estão com chave configurada no backend.
- Definir provider padrão.
- Configurar base URL por provider.
- Configurar provider/modelo por tarefa.
- Ajustar temperatura e `maxTokens`.
- Ver consumo total de tokens.
- Ver consumo por provider e por tarefa.
- Ver últimas chamadas locais.
- Limpar o histórico local de consumo.

As API keys não são exibidas nem editadas no frontend. Elas devem ficar no `server/.env`.

### Arquivos Locais de IA

O backend cria arquivos locais para configuração e uso:

```text
server/ai-config.local.json
server/ai-usage.local.json
```

Esses arquivos estão no `.gitignore` e não devem ser publicados. Eles não armazenam prompts nem respostas completas, apenas metadados de consumo, como provider, modelo, tarefa, tokens e latência.

### Plano de Implantação da IA

1. Configure as chaves em `server/.env`.
2. Rode o app localmente com `npm run dev`.
3. Abra `Configurações > IA`.
4. Confirme se os providers configurados aparecem como `chave ok`.
5. Escolha o provider/modelo por tarefa.
6. Execute uma importação, categorização ou insight.
7. Volte para `Configurações > IA` e confira o consumo de tokens.
8. Compare qualidade, custo e latência entre providers.
9. Antes de publicar, confirme que `.env` e `server/*.local.json` não serão enviados ao Git.

## Scripts

Na raiz:

```bash
npm run dev
npm run dev:docker
npm run docker:up
npm run db:migrate
npm run db:deploy
npm run db:push
npm run server:dev
npm run seed:demo
npm run client:dev
npm run build
npm run lint
npm run preview
```

No backend:

```bash
npm run dev --prefix server
npm run db:migrate --prefix server
npm run db:deploy --prefix server
npm run db:push --prefix server
npm run seed:demo --prefix server
npm run build --prefix server
```

## Validação Antes de Subir para o Git

Rode:

```bash
npm run build
npm run build --prefix server
npm run lint -- --quiet
npm audit
npm audit --prefix server
```

Estado atual esperado:

- Build do frontend passando.
- Build do backend passando.
- Audit do frontend sem vulnerabilidades conhecidas.
- Audit do backend sem vulnerabilidades conhecidas.
- Lint sem erros quando executado com `--quiet`.
- Tela de IA não exibindo chaves, apenas status de configuração.
- `server/ai-config.local.json` e `server/ai-usage.local.json` ignorados pelo Git.

O lint completo ainda pode exibir warnings de dívida técnica, principalmente uso de `any`, imports/variáveis não usados e alguns hooks com dependências a revisar.

## Segurança e Hardening Aplicados

Mudanças recentes relevantes para publicação do código:

- `.env` e `.env.*` foram adicionados ao `.gitignore`.
- `.env.example` e `server/.env.example` foram adicionados para documentar configuração sem expor segredo.
- `npm run dev` não depende mais de Docker automaticamente.
- `npm run dev:docker` foi criado para quem quer subir o banco via Docker.
- `docker-compose.yml` removeu o atributo obsoleto `version`.
- Credenciais do PostgreSQL no compose passaram a vir de variáveis de ambiente com fallback.
- Backend usa `helmet`.
- Backend usa rate limit em `/api`.
- Backend usa CORS restrito por `ALLOWED_ORIGINS`.
- Backend usa limite de corpo JSON por `JSON_BODY_LIMIT`.
- Backend valida payloads principais com `zod` antes de enviar dados ao Prisma.
- Backend não retorna mais mensagens internas de erro para o cliente em falhas genéricas.
- Backend usa `HOST` configurável e não escuta mais fixo em `0.0.0.0`.
- Backend suporta roteamento de IA por provider/tarefa.
- Backend registra consumo local de tokens sem armazenar prompts ou respostas.
- Configuração local de IA fica fora do Git.

## Estrutura do Projeto

```text
src/
  application/      Hooks e orquestração de casos de uso do frontend
  domain/           Entidades, value objects e services de domínio
  infrastructure/   API clients, repositórios HTTP e serviços técnicos
  presentation/     Páginas, layout e componentes React

server/
  index.ts          API Express
  ai.ts             Providers, roteamento e medição de consumo de IA
  prisma/           Schema Prisma e migrations versionadas

public/             Assets públicos
docker-compose.yml  PostgreSQL local via Docker
```

## Observações Importantes

- Antes de publicar no GitHub, confirme que nenhum `.env` real foi commitado anteriormente.
- Se alguma chave já tiver sido exposta, gere uma nova chave e revogue a antiga.
- O cofre de senhas usa criptografia local no frontend e é adequado apenas para uso pessoal/local. Para produção multiusuário, mova criptografia e gestão de segredo para o backend.
- As chaves de IA devem ficar sempre no backend. Não coloque API keys em código fonte, frontend ou README.
- O consumo de tokens exibido pode ser estimado quando o provider não retornar `usage` completo.
- O backend ainda está concentrado em `server/index.ts`; uma próxima melhoria recomendada é separar rotas, controllers, schemas, services e repositories.

## Licença

Este projeto está licenciado sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

Desenvolvido por Felipe.
