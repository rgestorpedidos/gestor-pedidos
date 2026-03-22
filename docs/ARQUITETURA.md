# 🏗️ Arquitetura — Gestor Pedidos

## Sistema de Gerenciamento de Pedidos para Bares e Restaurantes

> Single-tenant, real-time order management com 3 interfaces: garçom app, painel cozinha, admin dashboard

---

## 📐 Route Groups

```
src/app/
├── (auth)/
│   ├── login/           # POST email + senha → JWT
│   └── register/        # Criação conta (admin only)
│
├── (garcom)/            # 👨‍💼 App do Garçom
│   ├── mesas/           # Grid mesas com status
│   ├── novo-pedido/     # Criar pedido (mesa → itens → confirmar)
│   ├── mesas/[id]/      # Detalhes mesa + adicionar itens
│   └── historico/       # Histórico pedidos
│
├── (cozinha)/           # 👨‍🍳 Painel Cozinha (Real-time)
│   ├── page.tsx         # Display pedidos confirmados
│   └── pedidos/[id]/    # Detalhes + marcar como pronto
│
├── (admin)/             # 🔑 Dashboard Admin
│   ├── dashboard/       # Vendas, métricas
│   ├── cardapio/        # CRUD itens menu
│   ├── relatorios/      # Consumo, ranking
│   ├── config/          # Config bar (mesas, horários)
│   └── usuarios/        # Gerenciar staff
│
└── api/
    ├── auth/            # POST login, GET user
    ├── mesas/           # CRUD mesas
    ├── pedidos/         # CRUD pedidos + transições
    ├── cardapio/        # GET items
    ├── relatorios/      # GET vendas/consumo
    └── ws/              # WebSocket real-time
```

---

## 🗄️ Modelos de Dados (Prisma)

### Core

```prisma
model User {
  id        String @id @default(cuid())
  email     String @unique
  name      String
  role      Role   // ADMIN | GARCOM | COZINHA
  password  String // bcrypt
  active    Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  ADMIN
  GARCOM
  COZINHA
}
```

### Mesas & Pedidos

```prisma
model Mesa {
  id          String @id @default(cuid())
  numero      Int @unique
  capacidade  Int
  status      MesaStatus @default(LIVRE)

  pedidos     Pedido[]
  consumo     Consumo[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum MesaStatus {
  LIVRE
  OCUPADA
  RESERVADA
}

model Pedido {
  id          String @id @default(cuid())
  numero      Int @autoincrement
  mesa        Mesa @relation(fields: [mesaId], references: [id])
  mesaId      String

  items       PedidoItem[]
  status      PedidoStatus @default(ABERTO)
  totalValue  Decimal @default(0)

  criadoPor   User? @relation(fields: [criadoPorId], references: [id])
  criadoPorId String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum PedidoStatus {
  ABERTO
  CONFIRMADO
  PREPARANDO
  PRONTO
  ENTREGUE
  CANCELADO
}

model PedidoItem {
  id          String @id @default(cuid())
  pedido      Pedido @relation(fields: [pedidoId], references: [id])
  pedidoId    String

  item        ItemCardapio @relation(fields: [itemId], references: [id])
  itemId      String

  quantidade  Int
  observacoes String?
  status      ItemStatus @default(PENDENTE)

  createdAt   DateTime @default(now())
}

enum ItemStatus {
  PENDENTE
  PREPARANDO
  PRONTO
}
```

### Menu & Consumo

```prisma
model ItemCardapio {
  id        String @id @default(cuid())
  nome      String
  preco     Decimal
  categoria String  // "bebida", "prato", "sobremesa"
  ativo     Boolean @default(true)

  items     PedidoItem[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Consumo {
  id          String @id @default(cuid())
  mesa        Mesa @relation(fields: [mesaId], references: [id])
  mesaId      String

  totalSpent  Decimal
  itemsCount  Int
  date        DateTime

  createdAt   DateTime @default(now())
}
```

---

## 🔄 Fluxos Principais

### 1. Criar Pedido (Garçom)

```
Garçom Seleciona Mesa
  → GET /api/mesas
  → Clica Mesa Livre
  → POST /api/pedidos { mesaId }
  → Página "Novo Pedido"
    → GET /api/cardapio
    → Seleciona itens
    → POST /api/pedidos/[id]/items { itemId, qty, obs }
    → Clica "Confirmar Pedido"
    → PATCH /api/pedidos/[id] { status: CONFIRMADO }
  ✅ Pedido criado
  → PATCH /api/mesas/[id] { status: OCUPADA }
```

### 2. Gerenciar Pedido (Cozinha)

```
Cozinha vê painel real-time (WebSocket)
  → GET /api/pedidos?status=CONFIRMADO,PREPARANDO
  → WebSocket updates quando novo pedido chega
  → Clica em pedido
    → Vê lista PedidoItems
    → Marca item como PREPARANDO
    → Marca item como PRONTO
    → Quando TODOS items PRONTO → PATCH /api/pedidos/[id] { status: PRONTO }
  → Garçom recolhe prato
    → PATCH /api/pedidos/[id] { status: ENTREGUE }
    → PATCH /api/mesas/[id] { status: LIVRE }
```

### 3. Gerar Relatório (Admin)

```
Admin em dashboard:
  → GET /api/relatorios/vendas?data=2026-03-22
    ← { totalVendas, topProdutos, horarioPico }
  → GET /api/relatorios/consumo?mesaId=1
    ← { gastoTotal, itemsMais, frequencia }
```

---

## 🔐 RBAC (Role-Based Access Control)

| Rota | ADMIN | GARCOM | COZINHA |
|------|-------|--------|---------|
| `(garcom)/mesas` | ❌ | ✅ | ❌ |
| `(garcom)/novo-pedido` | ❌ | ✅ | ❌ |
| `(cozinha)/` | ❌ | ❌ | ✅ |
| `(admin)/dashboard` | ✅ | ❌ | ❌ |
| `(admin)/cardapio` | ✅ | ❌ | ❌ |
| `POST /api/pedidos` | ❌ | ✅ | ❌ |
| `PATCH /api/pedidos/[id]/status` | ❌ | ❌ | ✅ |

Middleware enforça em `src/middleware.ts`.

---

## 🌐 Real-time (WebSocket)

### Cozinha Panel

```typescript
// src/app/api/ws/route.ts
// WebSocket para atualizações real-time

Evento "novo-pedido" → Cozinha recebe notificação
Evento "item-pronto" → Garçom vê atualização
Evento "pedido-pronto" → Garçom notificado
```

### Polling (Garçom)

```typescript
// App garçom faz polling GET /api/pedidos a cada 2-3s
// Menos crítico, menos load
```

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14+ (App Router), React, Tailwind CSS
- **UI Components:** shadcn/ui
- **State:** Zustand + React Hooks
- **DB:** Supabase (PostgreSQL) + Prisma ORM
- **Real-time:** Next.js WebSocket (built-in)
- **Auth:** Supabase Auth (JWT)
- **Deploy:** Vercel + Supabase Hosted

---

## 📋 Próxima Etapa

Documentação completa será preenchida durante **Fase 1: Setup Base**.

Veja [ROADMAP.md](./ROADMAP.md) para cronograma.
