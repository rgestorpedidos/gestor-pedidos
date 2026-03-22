# 📘 CLAUDE.md — Gestor Pedidos

> Guia completo de arquitetura, desenvolvimento e padrões para o projeto Gestor Pedidos.

---

## 🎯 Resumo Executivo

**Gestor Pedidos** é um sistema de gerenciamento de pedidos em tempo real para **bares e restaurantes**.

### O Sistema Em 3 Partes:

1. **👨‍💼 App Garçom:** Toma pedidos, adiciona itens, visualiza status
2. **👨‍🍳 Painel Cozinha:** Vê pedidos confirmados, marca como pronto (real-time WebSocket)
3. **🔑 Admin Dashboard:** Relatórios, cardápio, configurações, histórico consumo

### Diferencial:

- **Single-tenant:** Cada bar/restaurante tem sua instância
- **Real-time:** Cozinha vê atualizações instantâneas via WebSocket
- **Simples:** Menu textual (sem fotos), apenas pedidos e mesas
- **Reusável:** Funciona para bar, pizzaria, restaurante, lanchonete

---

## 🛠️ Tech Stack

```
Frontend:     Next.js 14+ (App Router), React, Tailwind CSS, shadcn/ui
State:        Zustand + React Hooks
Backend:      Next.js API Routes (serverless)
Database:     PostgreSQL (Supabase) + Prisma ORM
Auth:         Supabase Auth (JWT)
Real-time:    Next.js WebSocket (built-in)
Deploy:       Vercel + Supabase Hosted
```

---

## 📁 Estrutura de Pastas

```
gestor-pedidos/
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout (fonts, Sonner)
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   │
│   │   ├── (garcom)/                # 👨‍💼 Private garçom routes
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx             # Dashboard mesas
│   │   │   ├── mesas/
│   │   │   │   └── [id]/page.tsx    # Detalhes mesa + adicionar itens
│   │   │   ├── novo-pedido/page.tsx
│   │   │   └── historico/page.tsx
│   │   │
│   │   ├── (cozinha)/               # 👨‍🍳 Private cozinha routes
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx             # Painel principal (real-time)
│   │   │   └── pedidos/[id]/page.tsx
│   │   │
│   │   ├── (admin)/                 # 🔑 Private admin routes
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx             # Dashboard principal
│   │   │   ├── cardapio/page.tsx
│   │   │   ├── relatorios/
│   │   │   │   ├── vendas/page.tsx
│   │   │   │   └── consumo/page.tsx
│   │   │   ├── config/page.tsx
│   │   │   └── usuarios/page.tsx
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── logout/route.ts
│   │       │   └── me/route.ts
│   │       ├── mesas/
│   │       │   ├── route.ts         # POST (criar), GET (listar)
│   │       │   └── [id]/route.ts    # GET, PATCH (status), DELETE
│   │       ├── pedidos/
│   │       │   ├── route.ts         # POST (criar), GET (listar)
│   │       │   ├── [id]/route.ts    # GET, PATCH (status), DELETE
│   │       │   └── [id]/items/route.ts  # POST (adicionar item)
│   │       ├── cardapio/
│   │       │   ├── route.ts         # GET, POST, DELETE
│   │       │   └── [id]/route.ts
│   │       ├── relatorios/
│   │       │   ├── vendas/route.ts
│   │       │   ├── consumo/route.ts
│   │       │   └── top-produtos/route.ts
│   │       └── ws/route.ts          # WebSocket real-time
│   │
│   ├── lib/
│   │   ├── supabase.ts              # Supabase client
│   │   ├── auth.ts                  # Auth helpers
│   │   ├── validators.ts            # Zod schemas
│   │   ├── types.ts                 # TypeScript types
│   │   ├── utils.ts                 # Utilitários gerais
│   │   └── hooks/
│   │       ├── useAuth.ts
│   │       ├── useMesas.ts
│   │       ├── usePedidos.ts
│   │       └── useCardapio.ts
│   │
│   └── components/
│       ├── auth/
│       ├── garcom/
│       ├── cozinha/
│       ├── admin/
│       └── common/
│
├── prisma/
│   ├── schema.prisma                # Modelos de dados
│   ├── migrations/
│   └── seed.ts                      # Seeds iniciais
│
├── public/
├── docs/
│   ├── CLAUDE.md                    # Este arquivo
│   ├── SETUP.md                     # Setup inicial
│   ├── ARQUITETURA.md               # Diagramas e fluxos
│   └── ROADMAP.md                   # Fases desenvolvimento
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── .env.local (NÃO commitar!)
```

---

## 🗄️ Modelos de Dados (Prisma)

### Users & Auth

```prisma
model User {
  id        String @id @default(cuid())
  email     String @unique
  name      String
  role      Role @default(GARCOM)  // ADMIN, GARCOM, COZINHA
  password  String                 // bcrypt hashed
  active    Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

enum Role {
  ADMIN
  GARCOM
  COZINHA
}
```

### Mesas

```prisma
model Mesa {
  id          String @id @default(cuid())
  numero      Int @unique
  capacidade  Int
  status      MesaStatus @default(LIVRE)  // LIVRE, OCUPADA, RESERVADA

  pedidos     Pedido[]
  consumo     Consumo[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("mesas")
}

enum MesaStatus {
  LIVRE
  OCUPADA
  RESERVADA
}
```

### Cardápio

```prisma
model ItemCardapio {
  id        String @id @default(cuid())
  nome      String
  preco     Decimal @db.Decimal(10, 2)
  categoria String              // "bebida", "prato", "sobremesa"
  ativo     Boolean @default(true)

  items     PedidoItem[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("itens_cardapio")
}
```

### Pedidos

```prisma
model Pedido {
  id          String @id @default(cuid())
  numero      Int @autoincrement     // Número sequencial (1, 2, 3...)
  mesa        Mesa @relation(fields: [mesaId], references: [id], onDelete: Cascade)
  mesaId      String

  items       PedidoItem[]
  status      PedidoStatus @default(ABERTO)  // ABERTO, CONFIRMADO, PREPARANDO, PRONTO, ENTREGUE, CANCELADO
  totalValue  Decimal @default(0) @db.Decimal(10, 2)

  criadoPor   User? @relation(fields: [criadoPorId], references: [id])
  criadoPorId String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("pedidos")
}

enum PedidoStatus {
  ABERTO       // Garçom criou mas não confirmou
  CONFIRMADO   // Pronto para cozinha preparar
  PREPARANDO   // Cozinha está preparando
  PRONTO       // Pronto para entregar
  ENTREGUE     // Garçom entregou ao cliente
  CANCELADO    // Cancelado antes de preparar
}
```

### Itens de Pedido

```prisma
model PedidoItem {
  id          String @id @default(cuid())
  pedido      Pedido @relation(fields: [pedidoId], references: [id], onDelete: Cascade)
  pedidoId    String

  item        ItemCardapio @relation(fields: [itemId], references: [id])
  itemId      String

  quantidade  Int
  observacoes String?                // "Sem cebola", "Bem passado", etc
  status      ItemStatus @default(PENDENTE)  // PENDENTE, PREPARANDO, PRONTO

  createdAt   DateTime @default(now())

  @@map("pedidos_items")
}

enum ItemStatus {
  PENDENTE    // Esperando cozinha
  PREPARANDO  // Sendo preparado
  PRONTO      // Pronto para servir
}
```

### Consumo

```prisma
model Consumo {
  id          String @id @default(cuid())
  mesa        Mesa @relation(fields: [mesaId], references: [id], onDelete: Cascade)
  mesaId      String

  totalSpent  Decimal @db.Decimal(10, 2)
  itemsCount  Int
  date        DateTime               // Data do consumo
  createdAt   DateTime @default(now())

  @@map("consumo")
}
```

---

## 🔐 RBAC (Controle de Acesso)

### Por Role:

| Rota / Ação | ADMIN | GARCOM | COZINHA |
|-------------|-------|--------|---------|
| `GET /api/mesas` | ✅ | ✅ | ❌ |
| `POST /api/mesas` | ✅ | ❌ | ❌ |
| `GET /api/pedidos` | ✅ | ✅ | ✅ |
| `POST /api/pedidos` | ❌ | ✅ | ❌ |
| `PATCH /api/pedidos/[id]/status` | ❌ | ❌ | ✅ (confirma pronto) |
| `GET /api/cardapio` | ✅ | ✅ | ❌ |
| `POST /api/cardapio` | ✅ | ❌ | ❌ |
| `GET /api/relatorios/*` | ✅ | ❌ | ❌ |
| `(garcom)/*` routes | ❌ | ✅ | ❌ |
| `(cozinha)/*` routes | ❌ | ❌ | ✅ |
| `(admin)/*` routes | ✅ | ❌ | ❌ |

**Middleware:** `src/middleware.ts` enforça RBAC em todas rotas privadas.

---

## 🔄 Fluxos Principais

### 1️⃣ Criar Pedido (Garçom)

```
1. Garçom acessa (garcom)/mesas
   → GET /api/mesas { status: "LIVRE" }
   → Vê grid de mesas

2. Clica mesa #5
   → Abre modal "Novo Pedido"

3. POST /api/pedidos { mesaId: "mesa-5" }
   → Cria pedido com status ABERTO

4. Adiciona itens
   → POST /api/pedidos/[id]/items { itemId, quantidade, obs }
   → Cada adição atualiza UI

5. Clica "Confirmar Pedido"
   → PATCH /api/pedidos/[id] { status: CONFIRMADO }
   → PATCH /api/mesas/[id] { status: OCUPADA }
   → WebSocket notifica cozinha ⚡
```

### 2️⃣ Gerenciar Pedido (Cozinha)

```
1. Cozinha acessa (cozinha)/
   → GET /api/pedidos { status: "CONFIRMADO,PREPARANDO" }
   → WebSocket "nova-pedido" dispara quando chega novo
   → Painel atualiza em tempo real

2. Vê pedido #42 com 3 itens
   → Começa a preparar

3. Marca item como PRONTO
   → PATCH /api/pedidos/[id]/items/[itemId] { status: PRONTO }
   → UI atualiza (item sai da view "preparando")

4. Quando TODOS itens PRONTO
   → PATCH /api/pedidos/[id] { status: PRONTO }
   → WebSocket notifica garçom
   → Garçom vê pedido pronto e entrega

5. Garçom marca ENTREGUE
   → PATCH /api/pedidos/[id] { status: ENTREGUE }
   → POST /api/consumo { mesaId, totalSpent, itemsCount }
   → PATCH /api/mesas/[id] { status: LIVRE }
```

### 3️⃣ Relatórios (Admin)

```
GET /api/relatorios/vendas?data=2026-03-22
← {
    totalVendas: 450.50,
    quantidadePedidos: 12,
    ticketMedio: 37.54,
    topProdutos: [
      { nome: "Cerveja", vendidas: 45, lucro: 90 },
      ...
    ]
  }

GET /api/relatorios/consumo?mesaId=1
← {
    totalGasto: 650.00,
    frequencia: 8,
    itemsMaisPedidos: ["Refrigerante", "Prato Principal"],
    ultimoConsume: "2026-03-22T18:30:00Z"
  }
```

---

## 🌐 Real-time (WebSocket)

### Server → Cozinha

```typescript
// src/app/api/ws/route.ts
// Eventos disparados:

// 1. Novo pedido confirmado
event: "novo-pedido"
payload: {
  pedidoId: "p-123",
  numero: 42,
  mesaNumero: 5,
  items: [{ id, nome, quantidade }],
  timestamp: Date
}

// 2. Item marcado como pronto
event: "item-pronto"
payload: {
  pedidoId: "p-123",
  itemId: "i-456",
  itemNome: "Cerveja"
}

// 3. Pedido cancelado
event: "pedido-cancelado"
payload: {
  pedidoId: "p-123",
  motivo: "Cancelado pelo garçom"
}
```

### Client (Cozinha)

```typescript
// Hook para conectar ao WebSocket
const useCozinhaRealtime = () => {
  useEffect(() => {
    const ws = new WebSocket(`wss://${domain}/api/ws`)

    ws.onmessage = (event) => {
      const { type, payload } = JSON.parse(event.data)

      if (type === "novo-pedido") {
        // Adiciona visual + som
        playNotificationSound()
        addPedidoToBoard(payload)
      }
    }
  }, [])
}
```

---

## 📝 Padrões de Código

### API Routes (Error Handling)

```typescript
// src/app/api/mesas/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateAuth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const user = await validateAuth(req)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const mesas = await prisma.mesa.findMany({
      where: { status: "LIVRE" },
      orderBy: { numero: "asc" }
    })

    return NextResponse.json(mesas)
  } catch (error) {
    console.error("[GET /api/mesas]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
```

### Validação (Zod)

```typescript
// src/lib/validators.ts
import { z } from "zod"

export const CreatePedidoSchema = z.object({
  mesaId: z.string().cuid(),
})

export const AddItemSchema = z.object({
  itemId: z.string().cuid(),
  quantidade: z.number().int().positive(),
  observacoes: z.string().optional(),
})

export type CreatePedidoInput = z.infer<typeof CreatePedidoSchema>
export type AddItemInput = z.infer<typeof AddItemSchema>
```

### Hooks (React)

```typescript
// src/lib/hooks/usePedidos.ts
import { useState, useCallback } from "react"

export const usePedidos = () => {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchPedidos = useCallback(async (status?: string) => {
    setLoading(true)
    try {
      const query = status ? `?status=${status}` : ""
      const res = await fetch(`/api/pedidos${query}`)
      const data = await res.json()
      setPedidos(data)
    } finally {
      setLoading(false)
    }
  }, [])

  return { pedidos, loading, fetchPedidos }
}
```

---

## 🚀 Comandos Úteis

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npx prisma studio      # Open Prisma Studio (DB explorer)
npx prisma generate    # Generate Prisma client

# Database
npx prisma migrate dev --name "add_column"  # Create migration
npx prisma migrate deploy                   # Apply migrations
npx prisma db seed                          # Run seeds

# Testing
npm run test            # Run tests
npm run test:e2e        # E2E tests

# Build & Deploy
npm run build           # Build for production
npm start               # Start production server
```

---

## 📚 Referências

- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Supabase Auth:** https://supabase.com/docs/guides/auth
- **shadcn/ui:** https://ui.shadcn.com
- **Tailwind CSS:** https://tailwindcss.com

---

## ❓ FAQ

**P: Por que single-tenant?**
R: Cada bar é instância separada. Multi-tenant adiciona complexidade (subdomínios, isolamento de dados) sem benefício inicial.

**P: Como fazer backup?**
R: Supabase tem backups automáticos. Para restore, contatar Supabase support.

**P: Dá pra integrar WhatsApp?**
R: Sim. Depois de MVP, podemos adicionar confirmação de pedidos via WhatsApp.

**P: E notificações sonoras na cozinha?**
R: Fase 2. API `Web Audio` + WebSocket trigger.

---

**Próximo:** Veja [SETUP.md](./SETUP.md) para setup inicial.
