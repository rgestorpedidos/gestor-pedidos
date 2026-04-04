# CLAUDE.md — Gestor Pedidos

Guia de referência para o agente Claude trabalhar neste projeto.

---

## Contexto do Projeto

Sistema de gestão de pedidos para bares e restaurantes. Single-tenant. Três interfaces: garçom (toma pedidos), cozinha (prepara), admin (gerencia).

> Atualização: Fases 0–5 concluídas. Pendência: deploy Vercel + migração SQLite → Postgres (Fase 6).

---

## Stack Atual

```
Next.js 16 (App Router)    React 19    TypeScript
Tailwind CSS 4             shadcn/ui   Lucide React
Supabase Auth              @supabase/ssr
Prisma 6                   SQLite (dev) / Postgres (prod)
Zustand 5                  Sonner (toasts)   Zod 4
```

---

## Estrutura de Arquivos Relevantes

```
src/
├── lib/
│   ├── roles.ts          # ROLES as const + tipo Role + ADMIN_ROLES
│   ├── auth.ts           # getUserRole() → usa getUser() (não getSession!)
│   ├── prisma.ts         # PrismaClient singleton
│   └── supabase/
│       ├── server.ts     # createClient() para Server Components/Actions
│       ├── client.ts     # createClient() para Client Components
│       └── admin.ts      # createAdminClient() com service role key
│
├── stores/
│   └── carrinho-garcom.ts  # Zustand persist+subscribeWithSelector; TTL 8h por mesaId
│
├── hooks/
│   └── useTabPolling.ts    # polling 10s com pause em visibilitychange + activeModal
│
├── actions/
│   ├── auth/
│   │   └── check-auth.ts       # checkEmailAuthorized(email) → verifica User no Prisma
│   ├── admin/
│   │   ├── metrics.ts          # getDashboardMetrics() → 8 queries paralelas (mesas, usuários, pedidos)
│   │   ├── mesas.ts            # createMesa / updateMesa / deleteMesa
│   │   ├── cardapio.ts         # CRUD: Categoria, ItemCardapio, OpcaoGrupo, Opcao (13 actions)
│   │   └── users.ts            # createUser / updateUserRole / setUserActive / deleteUser (Supabase Admin API + Prisma)
│   ├── garcom/
│   │   └── pedidos.ts          # abrirOuObterPedido, enviarRodada, cancelarItem,
│   │                           # fecharPedido, confirmarReserva
│   └── cozinha/                # ← Painel da cozinha implementado
│
├── app/
│   ├── page.tsx                    # Root: redireciona por role
│   ├── (auth)/login/               # Magic link login
│   ├── (admin)/
│   │   ├── layout.tsx              # Guard ADMIN_ROLES + SidebarInset + SidebarTrigger
│   │   ├── error.tsx               # Error boundary do admin
│   │   └── admin/
│   │       ├── page.tsx            # Dashboard (Client Component, fetch /api/admin/metrics)
│   │       ├── loading.tsx
│   │       ├── mesas/              # CRUD de mesas (page + loading)
│   │       ├── cardapio/           # Tabs Itens/Categorias (page + loading)
│   │       ├── users/              # Gestão de usuários (page + loading)
│   │       └── super/              # SUPERADMIN exclusivo: métricas + delete usuário (page + loading)
│   ├── (garcom)/
│   │   ├── layout.tsx              # Guard GARCOM_ROLES + SidebarInset
│   │   ├── error.tsx               # Error boundary do garçom
│   │   └── garcom/
│   │       ├── page.tsx            # Grid de mesas com ENVIADO count
│   │       ├── loading.tsx
│   │       └── mesa/[id]/
│   │           ├── page.tsx        # Scroll menu por categoria + dados do pedido ativo
│   │           ├── loading.tsx
│   │           └── not-found.tsx
│   ├── (cozinha)/cozinha/          # ← Painel da cozinha implementado
│   └── api/
│       ├── auth/callback/          # Handler do magic link
│       └── admin/metrics/          # GET → getDashboardMetrics()
│
└── components/app/
    ├── sidebar.tsx           # AppSidebar — NavGroup + NavUser + SidebarRail
    ├── nav-group.tsx         # Grupos colapsáveis
    ├── nav-user.tsx          # Footer com Avatar + dropdown logout
    ├── types.ts              # NavLink, NavCollapsible, NavGroup, SidebarData
    ├── mesas/                # MesaCard, MesaForm, DeleteDialog
    ├── cardapio/             # CategoriaForm, ItemForm, CardapioTabs
    ├── users/                # UserForm (Sheet criar/editar), UsersTable
    └── garcom/
        ├── types.ts                # Tipos: ItemCardapioData, CategoriaData, PedidoAtivoData...
        ├── mesa-garcom-card.tsx    # Card com badge ENVIADO + botão ConfirmarReserva
        ├── mesa-garcom-view.tsx    # View principal client: polling + ProductModal + CartDrawer
        ├── item-cardapio-card.tsx  # Card de item com botão + (touch target 44px)
        ├── product-modal.tsx       # Sheet bottom: radio/checkbox grupos + observação
        └── cart-drawer.tsx         # Sheet bottom: RASCUNHO/ENVIADO/PRONTO + Enviar/Fechar
```

---

## Regras Críticas

### Auth
- **SEMPRE** usar `supabase.auth.getUser()` em Server Components e Actions — nunca `getSession()`
- `getSession()` lê cookie sem revalidar com o servidor → vulnerável a token expirado/manipulado
- Server Actions devem ter guard de autenticação próprio (defense in depth)

### RBAC
- Usar constantes de `lib/roles.ts` — nunca strings literais `'ADMIN'` no código
- `ADMIN_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN]` para guards de área admin
- `GARCOM_ROLES = [ROLES.GARCOM, ROLES.ADMIN, ROLES.SUPERADMIN]` para guards do garçom
- Role `SUPERADMIN` redireciona para `/admin` (mesma área que ADMIN)

### Prisma
- `User.id` é definido explicitamente com o UUID do Supabase Auth no `create-superadmin.ts`
- Queries paralelas independentes → usar `Promise.allSettled` (métricas) ou `Promise.all` (queries que precisam de todos os dados)
- `$transaction` em operações atômicas — sem `isolationLevel` (SQLite não suporta)
- Nunca deletar `Categoria` ou `ItemCardapio` com filhos — `ON DELETE RESTRICT` protege; mostrar erro legível com `fkErrorMsg()`

### Migrations
- **Usar `prisma migrate dev`**, não `prisma db push` — baseline `0_init` já criado
- Ao trocar de máquina: `npx prisma migrate deploy`
- Em dev: `npx prisma migrate dev --name <descricao>`
- `prisma generate` pode falhar com EPERM no Windows quando o dev server está rodando (DLL lock) — reiniciar o servidor resolve

### Next.js
- Pages com dados dinâmicos → `export const dynamic = 'force-dynamic'`
- Skeleton de loading → criar `loading.tsx` na pasta da rota
- Error boundary → criar `error.tsx` com `'use client'` + props `error` e `reset`
- `not-found.tsx` para recursos inexistentes (chama `notFound()` no Server Component)

### Zustand (store do garçom)
- `useCarrinhoGarcomStore` tem persist com `partialize` — apenas `carrinhos` é persistido, não `activeModal`
- `activeModal` controla qual modal está aberto — `null` = nenhum; `'cart'` = CartDrawer; `'product:id'` = ProductModal
- ProductModal e CartDrawer **nunca** abertos simultaneamente — `setActiveModal` garante isso
- `purgeExpired()` deve ser chamado no mount do componente principal do garçom

### Zod v4
- `z.record()` em Zod v4 requer 2 argumentos: `z.record(z.string(), valorSchema)`
- `z.coerce.boolean()` para campos de formulário HTML

### Prisma + Json
- Para campos `Json?` nullable em `createMany`, usar `Prisma.DbNull` para null explícito

---

## Prisma Schema Atual

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      String   @default("GARCOM")
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Mesa {
  id        String   @id @default(cuid())
  numero    Int      @unique
  status    String   @default("LIVRE")   // LIVRE | OCUPADA | RESERVADA
  pedidos   Pedido[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Pedido {
  id              String       @id @default(cuid())
  mesaId          String
  mesa            Mesa         @relation(...)
  status          String       @default("ABERTO") // ABERTO | FECHADO
  metodoPagamento String?
  itens           PedidoItem[]
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  @@index([mesaId])
}

model PedidoItem {
  id                 String       @id @default(cuid())
  pedidoId           String
  pedido             Pedido       @relation(...)
  itemCardapioId     String
  itemCardapio       ItemCardapio @relation(...)
  nomeSnapshot       String       // snapshot imutável
  precoUnitario      Float        // preco base + adicionais das opções
  quantidade         Int
  observacao         String?
  opcoesSelecionadas Json?        // snapshot: Record<grupoId, opcaoId[]>
  status             String       @default("ENVIADO") // ENVIADO | PRONTO
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt
  @@index([pedidoId])
  @@index([itemCardapioId])
}

model Categoria {
  id        String         @id @default(cuid())
  nome      String         @unique
  ordem     Int            @default(0)
  ativo     Boolean        @default(true)
  itens     ItemCardapio[]
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
}

model ItemCardapio {
  id             String       @id @default(cuid())
  nome           String
  descricao      String?
  preco          Float
  imagemUrl      String?      // URL externa — sem upload
  vaiParaCozinha Boolean      @default(true)
  ativo          Boolean      @default(true)
  categoriaId    String
  categoria      Categoria    @relation(...)
  opcaoGrupos    OpcaoGrupo[]
  pedidoItens    PedidoItem[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  @@index([categoriaId])
}

model OpcaoGrupo {
  id             String       @id @default(cuid())
  nome           String
  obrigatorio    Boolean      @default(false)
  minSelecoes    Int          @default(0)
  maxSelecoes    Int          @default(1)
  itemCardapioId String
  item           ItemCardapio @relation(...)
  opcoes         Opcao[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  @@index([itemCardapioId])
}

model Opcao {
  id             String     @id @default(cuid())
  nome           String
  precoAdicional Float      @default(0)
  ativo          Boolean    @default(true)
  opcaoGrupoId   String
  grupo          OpcaoGrupo @relation(...)
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  @@index([opcaoGrupoId])
}
```

---

## Rotas Implementadas vs Planejadas

| Rota | Status |
|------|--------|
| `/login` | ✅ Implementada |
| `/admin` (dashboard) | ✅ Implementada |
| `/api/admin/metrics` | ✅ Implementada |
| `/admin/mesas` | ✅ Implementada (CRUD) |
| `/admin/cardapio` | ✅ Implementada (tabs Itens/Categorias) |
| `/admin/users` | ✅ Implementada (listar, criar, editar role, ativar/desativar) |
| `/admin/super` | ✅ Implementada (SUPERADMIN exclusivo, métricas + delete usuário) |
| `/garcom` | ✅ Implementada (grid + ENVIADO count + confirmar reserva) |
| `/garcom/mesa/[id]` | ✅ Implementada (scroll menu + ProductModal + CartDrawer) |
| `/cozinha` | ✅ Implementada |

---

## Comandos do Projeto

```bash
npm run dev                                        # Dev server
npm run create-superadmin <email> "Nome"           # Criar superadmin
npx prisma migrate dev --name <descricao>          # Nova migration (não usar db push)
npx prisma migrate status                          # Verificar estado das migrations
npx prisma studio                                  # Explorer do banco
```

---

## Anti-patterns a Evitar

- ❌ `supabase.auth.getSession()` em Server Components
- ❌ Strings literais de role (`'ADMIN'`) — usar `ROLES.ADMIN`
- ❌ `Promise.all` para queries que podem falhar individualmente (usar `Promise.allSettled`)
- ❌ Server Action sem guard de autenticação próprio
- ❌ `export const dynamic` omitido em pages com dados frequentemente atualizados
- ❌ Criar usuário sem definir o `id` como o UUID do Supabase Auth
- ❌ `prisma db push` após a baseline — usar `prisma migrate dev`
- ❌ `isolationLevel` em `$transaction` no SQLite — não suportado
- ❌ `z.record(valorSchema)` em Zod v4 — passar 2 args: `z.record(z.string(), valorSchema)`
- ❌ Passar `null` direto para campo `Json?` no Prisma — usar `Prisma.DbNull`
- ❌ ProductModal e CartDrawer abertos simultaneamente — controlar via `activeModal`


