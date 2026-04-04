# Gestor Pedidos

Sistema de gerenciamento de pedidos em tempo real para bares e restaurantes — app para garçons, painel para cozinha, dashboard para admin.

## Status Atual

- Fases 0, 0.5, 1, 2a, 2b, 2c e 3 concluídas.
- Próxima frente de trabalho: Fase 4, com `/admin/users` e métricas de pedidos.
- A base local ainda usa SQLite no Prisma; Postgres continua como destino de produção.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | Tailwind CSS 4 + shadcn/ui |
| Auth | Supabase Auth (Magic Link — sem senha) |
| Database | Prisma ORM + SQLite (dev) / Postgres planejado para produção |
| State | Zustand 5 (persist + subscribeWithSelector) |
| Linguagem | TypeScript |

## Estrutura de Rotas

```
src/app/
├── (auth)/login              # Magic link — sem senha
├── (admin)/admin             # Dashboard, mesas, cardápio
├── (garcom)/garcom           # App do garçom (scroll menu, pedidos)
├── (cozinha)/cozinha         # Painel da cozinha implementado
└── api/auth/callback         # Handler do magic link
```

## Roles

| Role | Acesso |
|------|--------|
| `SUPERADMIN` | Tudo — gestão total do sistema |
| `ADMIN` | Dashboard, mesas, cardápio, usuários |
| `GARCOM` | App de atendimento |
| `COZINHA` | Painel de pedidos |

## Quick Start

```bash
npm install
npx prisma migrate dev    # Aplica migrations ao SQLite local
npm run dev
```

> **Atenção:** use `prisma migrate dev`, não `prisma db push`. A baseline já está configurada.

## Criar Superadmin

```bash
npm run create-superadmin seu@email.com "Seu Nome"
```

Cria o usuário no Supabase Auth (sem senha) e no banco Prisma com role `SUPERADMIN`. O login é feito via magic link enviado ao e-mail.

## Variáveis de Ambiente

Crie `.env.local` com:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

O arquivo `.env` contém apenas `DATABASE_URL` para o SQLite local.

## Fluxo do Garçom

1. Abre mesa → `abrirOuObterPedido` cria Pedido ABERTO
2. Navega no cardápio por categoria
3. Adiciona itens ao carrinho local (Zustand)
4. "Enviar Rodada" → itens vão ao banco como ENVIADO (ou PRONTO se não precisam de preparo)
5. Cozinha marca itens como PRONTO
6. "Fechar Conta" → seleciona pagamento → Pedido FECHADO, mesa LIVRE

## Documentação

| Doc | Descrição |
|-----|-----------|
| [docs/ARQUITETURA.md](./docs/ARQUITETURA.md) | Arquitetura, RBAC, fluxo de pedidos |
| [docs/SETUP.md](./docs/SETUP.md) | Setup completo passo a passo |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Fases e status de desenvolvimento |
| [docs/CLAUDE.md](./docs/CLAUDE.md) | Guia para o agente Claude |
| [docs/PROXIMOS-PASSOS.md](./docs/PROXIMOS-PASSOS.md) | Tarefas detalhadas da próxima fase |
| [CHANGELOG.md](./CHANGELOG.md) | Histórico de mudanças |
